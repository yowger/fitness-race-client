import {
    Camera,
    CameraRef,
    MapView,
    MapViewRef,
    PointAnnotation,
    ShapeSource,
    LineLayer,
    UserLocation,
} from "@maplibre/maplibre-react-native"
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
    Dimensions,
} from "react-native"
import React, { useEffect, useRef, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import * as Location from "expo-location"

import { getSocket } from "@/lib/socket"
import { MAP_STYLE_URL } from "@/config/map"
import { useAuth } from "@/providers/AuthProvider"
import { useRoute } from "@/api/race"
import { useProfile } from "@/api/user"
import { useRace } from "@/api/races"
import { Socket } from "socket.io-client"

export type UserIdentity = {
    id: string
    name: string
    avatarUrl?: string
    role: "admin" | "racer" | "guest"
    bib?: number
}

export type LiveRaceState = {
    lat: number
    lng: number
    speed?: number
    distance?: number
    finished: boolean
    lastUpdate: number
}

export type RaceUser = UserIdentity & { state: LiveRaceState }

function haversineDistance(
    [lng1, lat1]: [number, number],
    [lng2, lat2]: [number, number]
) {
    const R = 6371000
    const toRad = (x: number) => (x * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function calculatePace(speed: number): string {
    if (speed <= 0) return "--:--"
    const paceMinPerKm = 60 / speed
    const mins = Math.floor(paceMinPerKm)
    const secs = Math.floor((paceMinPerKm - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

const { width } = Dimensions.get("window")

const Active = () => {
    const socketRef = useRef<Socket>(null)
    const { id: raceId } = useLocalSearchParams<{ id: string }>()
    const { data: user } = useProfile()
    const { data: race, isLoading, isError } = useRace(raceId!)
    // const routeId = race?.route_id
    // const { data: route } = useRoute(routeId!)
    const { session } = useAuth()
    const router = useRouter()

    const [participants, setParticipants] = useState<RaceUser[]>([])
    const [userLocation, setUserLocation] =
        useState<Location.LocationObject | null>(null)
    const [totalDistance, setTotalDistance] = useState(0)
    const [currentSpeed, setCurrentSpeed] = useState(0)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [showLeaderboard, setShowLeaderboard] = useState(false)
    const [isRaceStarted, setIsRaceStarted] = useState(false)

    const mapRef = useRef<MapViewRef>(null)
    const cameraRef = useRef<CameraRef>(null)
    const prevCoordsRef = useRef<[number, number] | null>(null)
    const startTimeRef = useRef<number | null>(null)
    const leaderboardAnim = useRef(new Animated.Value(0)).current

    const recenter = () => {
        if (userLocation && cameraRef.current) {
            cameraRef.current.flyTo(
                [userLocation.coords.longitude, userLocation.coords.latitude],
                500
            )
            cameraRef.current.zoomTo(16, 500)
        }
    }

    const toggleLeaderboard = () => {
        setShowLeaderboard(!showLeaderboard)
        Animated.spring(leaderboardAnim, {
            toValue: showLeaderboard ? 0 : 1,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
        }).start()
    }

    // Timer effect
    useEffect(() => {
        if (!isRaceStarted) return

        const interval = setInterval(() => {
            if (startTimeRef.current) {
                setElapsedTime(
                    Math.floor((Date.now() - startTimeRef.current) / 1000)
                )
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [isRaceStarted])

    // Check if race has started
    useEffect(() => {
        if (race?.actual_start_time) {
            setIsRaceStarted(true)
            startTimeRef.current = new Date(race.actual_start_time).getTime()
        }
    }, [race])

    useEffect(() => {
        if (!session || !raceId) return

        socketRef.current = getSocket()

        socketRef.current.emit("joinRace", {
            raceId: raceId,
            userId: session?.user.id,
        })

        socketRef.current.on(
            "participantUpdate",
            (updatedParticipants: RaceUser[]) => {
                setParticipants(updatedParticipants)
            }
        )

        socketRef.current.on("notAllowed", () => {
            alert("You are not allowed to join this race")
        })

        return () => {
            if (socketRef.current) {
                socketRef.current.emit("leaveRace", {
                    raceId: raceId,
                    userId: session?.user.id,
                })
                socketRef.current.removeAllListeners()
            }
        }
    }, [raceId, session])

    useEffect(() => {
        let subscriber: Location.LocationSubscription | null = null

        ;(async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync()
            if (status !== "granted") return

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            })
            setUserLocation(loc)

            subscriber = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.Highest, distanceInterval: 1 },
                (locUpdate) => {
                    if (!session || !raceId) return

                    const { latitude, longitude, speed } = locUpdate.coords
                    const coords: [number, number] = [longitude, latitude]

                    if (speed != null && speed > 0) {
                        setCurrentSpeed(speed * 3.6)
                    }

                    if (prevCoordsRef.current && isRaceStarted) {
                        const meters = haversineDistance(
                            prevCoordsRef.current,
                            coords
                        )
                        setTotalDistance((d) => d + meters / 1000)
                    }

                    prevCoordsRef.current = coords
                    setUserLocation(locUpdate)

                    if (socketRef.current?.connected) {
                        socketRef.current.emit("participantUpdate", {
                            userId: session.user.id,
                            raceId,
                            coords: [
                                locUpdate.coords.longitude,
                                locUpdate.coords.latitude,
                            ],
                            timestamp: Date.now(),
                            speed: locUpdate.coords.speed ?? 0,
                        })
                    }
                }
            )
        })()

        return () => subscriber?.remove()
    }, [session, raceId, isRaceStarted])

    useEffect(() => {
        ;(async () => {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            })
            if (loc && cameraRef.current) {
                cameraRef.current.setCamera({
                    centerCoordinate: [
                        loc.coords.longitude,
                        loc.coords.latitude,
                    ],
                    zoomLevel: 16,
                    animationDuration: 1000,
                })
            }
        })()
    }, [])

    // const myRank =
    //     (Array.isArray(participants) ? participants : [])
    //         .sort((a, b) => (b.state?.distance ?? 0) - (a.state?.distance ?? 0))
    //         .findIndex((p) => p.id === session?.user.id) + 1

    // const leaderboardTranslate = leaderboardAnim.interpolate({
    //     inputRange: [0, 1],
    //     outputRange: [300, 0],
    // })

    return (
        <View style={styles.container}>
            <MapView
                style={StyleSheet.absoluteFillObject}
                attributionEnabled={false}
                mapStyle={MAP_STYLE_URL}
                ref={mapRef}
            >
                {userLocation && (
                    <UserLocation visible animated showsUserHeadingIndicator />
                )}

                {/* {participants
                    .filter((p) => p.id !== session?.user.id)
                    .map((p) => (
                        <PointAnnotation
                            key={p.id}
                            id={p.id}
                            coordinate={[p.state.lng, p.state.lat]}
                        >
                            <View style={styles.participantMarker}>
                                <Text style={styles.participantLabel}>
                                    {p.bib || "?"}
                                </Text>
                            </View>
                        </PointAnnotation>
                    ))} */}

                {cameraRef.current && userLocation && (
                    <Camera
                        ref={cameraRef}
                        zoomLevel={16}
                        animationMode="flyTo"
                        animationDuration={500}
                    />
                )}

                {race?.routes?.geojson.features?.[0]?.geometry?.coordinates && (
                    <ShapeSource
                        id="routeLine"
                        shape={{
                            type: "Feature",
                            geometry: {
                                type: "LineString",
                                coordinates:
                                    race?.routes?.geojson.features[0].geometry
                                        .coordinates,
                            },
                            properties: {},
                        }}
                    >
                        <LineLayer
                            id="routeLineLayer"
                            style={{
                                lineColor: "#3B82F6",
                                lineWidth: 5,
                                lineOpacity: 0.8,
                            }}
                        />
                    </ShapeSource>
                )}

                {race?.routes?.geojson.features?.[0]?.geometry?.coordinates
                    ?.length && (
                    <>
                        <PointAnnotation
                            id="start"
                            coordinate={
                                race?.routes?.geojson.features[0].geometry
                                    .coordinates[0]
                            }
                        >
                            <View style={styles.startMarker}>
                                <Text style={styles.markerText}>S</Text>
                            </View>
                        </PointAnnotation>

                        <PointAnnotation
                            id="finish"
                            coordinate={
                                race?.routes?.geojson.features[0].geometry
                                    .coordinates[
                                    race?.routes?.geojson.features[0].geometry
                                        .coordinates.length - 1
                                ]
                            }
                        >
                            <View style={styles.finishMarker}>
                                <Text style={styles.markerText}>F</Text>
                            </View>
                        </PointAnnotation>
                    </>
                )}
            </MapView>

            {/* Race Info Header */}
            <View style={styles.header}>
                <View style={styles.raceInfo}>
                    <Text style={styles.raceName} numberOfLines={1}>
                        {race?.name || "Loading..."}
                    </Text>
                    <Text style={styles.raceStatus}>
                        {isRaceStarted ? "🏃 Live" : "⏸️ Not Started"}
                    </Text>
                </View>
            </View>

            {/* Main Stats Card */}
            <View style={styles.statsCard}>
                <View style={styles.primaryStat}>
                    <Text style={styles.primaryStatLabel}>TIME</Text>
                    <Text style={styles.primaryStatValue}>
                        {formatTime(elapsedTime)}
                    </Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Distance</Text>
                        <Text style={styles.statValue}>
                            {totalDistance.toFixed(2)}
                        </Text>
                        <Text style={styles.statUnit}>km</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Pace</Text>
                        <Text style={styles.statValue}>
                            {calculatePace(currentSpeed)}
                        </Text>
                        <Text style={styles.statUnit}>min/km</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Speed</Text>
                        <Text style={styles.statValue}>
                            {currentSpeed.toFixed(1)}
                        </Text>
                        <Text style={styles.statUnit}>km/h</Text>
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            {/* <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={recenter}
                    activeOpacity={0.7}
                >
                    <Text style={styles.iconButtonText}>📍</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.iconButton, styles.leaderboardButton]}
                    onPress={toggleLeaderboard}
                    activeOpacity={0.7}
                >
                    <Text style={styles.iconButtonText}>🏆</Text>
                    {myRank > 0 && (
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankBadgeText}>{myRank}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View> */}

            {/* Leaderboard Panel */}
            {/* <Animated.View
                style={[
                    styles.leaderboardPanel,
                    { transform: [{ translateY: leaderboardTranslate }] },
                ]}
            >
                <View style={styles.leaderboardHeader}>
                    <Text style={styles.leaderboardTitle}>Live Rankings</Text>
                    <TouchableOpacity onPress={toggleLeaderboard}>
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.leaderboardContent}>
                    {participants?.length === 0 ? (
                        <Text style={styles.emptyText}>
                            No participants yet
                        </Text>
                    ) : (
                        participants
                            ?.sort(
                                (a, b) =>
                                    (b.state.distance || 0) -
                                    (a.state.distance || 0)
                            )
                            .slice(0, 10)
                            .map((participant, index) => {
                                const isCurrentUser =
                                    participant.id === session?.user.id
                                return (
                                    <View
                                        key={participant.id}
                                        style={[
                                            styles.leaderboardItem,
                                            isCurrentUser &&
                                                styles.currentUserItem,
                                        ]}
                                    >
                                        <View style={styles.rankContainer}>
                                            <View
                                                style={[
                                                    styles.rankCircle,
                                                    index === 0 &&
                                                        styles.goldRank,
                                                    index === 1 &&
                                                        styles.silverRank,
                                                    index === 2 &&
                                                        styles.bronzeRank,
                                                ]}
                                            >
                                                <Text style={styles.rankText}>
                                                    {index + 1}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.participantInfo}>
                                            <Text
                                                style={styles.participantName}
                                                numberOfLines={1}
                                            >
                                                {participant.name}
                                                {isCurrentUser && " (You)"}
                                            </Text>
                                            <Text
                                                style={styles.participantStats}
                                            >
                                                {(
                                                    participant.state
                                                        .distance || 0
                                                ).toFixed(2)}{" "}
                                                km •{" "}
                                                {participant.state.speed
                                                    ? `${participant.state.speed.toFixed(
                                                          1
                                                      )} km/h`
                                                    : "N/A"}
                                            </Text>
                                        </View>

                                        {participant.bib && (
                                            <View style={styles.bibBadge}>
                                                <Text style={styles.bibText}>
                                                    #{participant.bib}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )
                            })
                    )}
                </View>
            </Animated.View> */}
        </View>
    )
}

export default Active

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        position: "absolute",
        top: 60,
        left: 16,
        right: 16,
        zIndex: 5,
    },
    raceInfo: {
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        // backdropFilter: "blur(10px)",
    },
    raceName: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        flex: 1,
        marginRight: 12,
    },
    raceStatus: {
        color: "#10B981",
        fontSize: 14,
        fontWeight: "600",
    },
    statsCard: {
        position: "absolute",
        bottom: 100,
        left: 16,
        right: 16,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        borderRadius: 24,
        padding: 20,
        zIndex: 5,
        // backdropFilter: "blur(10px)",
    },
    primaryStat: {
        alignItems: "center",
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    primaryStatLabel: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 2,
        marginBottom: 8,
    },
    primaryStatValue: {
        color: "#fff",
        fontSize: 48,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statLabel: {
        color: "#94A3B8",
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 6,
    },
    statValue: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },
    statUnit: {
        color: "#64748B",
        fontSize: 12,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    actionButtons: {
        position: "absolute",
        bottom: 32,
        right: 16,
        flexDirection: "column",
        gap: 12,
        zIndex: 5,
    },
    iconButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    leaderboardButton: {
        position: "relative",
    },
    iconButtonText: {
        fontSize: 24,
    },
    rankBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#3B82F6",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#000",
    },
    rankBadgeText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "700",
    },
    leaderboardPanel: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 32,
        maxHeight: "70%",
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    leaderboardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    leaderboardTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
    },
    closeButton: {
        color: "#94A3B8",
        fontSize: 24,
        fontWeight: "400",
    },
    leaderboardContent: {
        padding: 16,
    },
    leaderboardItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
    },
    currentUserItem: {
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        borderWidth: 1,
        borderColor: "rgba(59, 130, 246, 0.3)",
    },
    rankContainer: {
        marginRight: 12,
    },
    rankCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    goldRank: {
        backgroundColor: "#FFD700",
    },
    silverRank: {
        backgroundColor: "#C0C0C0",
    },
    bronzeRank: {
        backgroundColor: "#CD7F32",
    },
    rankText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "700",
    },
    participantInfo: {
        flex: 1,
        marginRight: 8,
    },
    participantName: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    participantStats: {
        color: "#94A3B8",
        fontSize: 13,
    },
    bibBadge: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bibText: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "600",
    },
    emptyText: {
        color: "#64748B",
        fontSize: 14,
        textAlign: "center",
        fontStyle: "italic",
        paddingVertical: 32,
    },
    participantMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F97316",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    participantLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#fff",
    },
    startMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#10B981",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    finishMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#EF4444",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    markerText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },
})

/*
 useEffect(() => {
        let subscriber: Location.LocationSubscription | null = null

        ;(async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync()
            if (status !== "granted") return

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            })
            setUserLocation(loc)

            subscriber = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.Highest, distanceInterval: 1 },
                (locUpdate) => {
                    if (!user) return

                    setUserLocation(locUpdate)
                    const socket = getSocket()

                    if (finish) {
                        const distanceToFinish = haversineDistance(
                            [
                                locUpdate.coords.longitude,
                                locUpdate.coords.latitude,
                            ],
                            finish
                        )
                        console.log(
                            "🚀 ~ Active ~ distanceToFinish:",
                            distanceToFinish
                        )
                    }
                }
            )
        })()

        return () => subscriber?.remove()
    }, [])
*/
