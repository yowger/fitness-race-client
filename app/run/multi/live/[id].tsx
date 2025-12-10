import {
    Camera,
    CameraRef,
    MapView,
    MapViewRef,
    PointAnnotation,
    ShapeSource,
    LineLayer,
} from "@maplibre/maplibre-react-native"
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
} from "react-native"
import React, { useEffect, useRef, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import * as Location from "expo-location"

import { getSocket } from "@/lib/socket"
import { MAP_STYLE_URL } from "@/config/map"
import { useAuth } from "@/providers/AuthProvider"
import { useRoute } from "@/api/race"
import { useProfile } from "@/api/user"
import { useRace } from "@/api/races"

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

const Active = () => {
    const { id } = useLocalSearchParams<{ id: string }>()
    const { data: user } = useProfile()

    const { data: race, isLoading, isError } = useRace(id!)
    const routeId = race?.route_id
    const { data: route } = useRoute(routeId!)
    const { session } = useAuth()
    const { roomId } = useLocalSearchParams()
    const [participants, setParticipants] = useState<RaceUser[]>([])
    const [userLocation, setUserLocation] =
        useState<Location.LocationObject | null>(null)
    const mapRef = useRef<MapViewRef>(null)
    const cameraRef = useRef<CameraRef>(null)
    const userId = session?.user.id

    const bibNumber = 101

    const finish = route?.geojson.features?.[0]?.geometry?.coordinates[
        route.geojson.features[0].geometry.coordinates.length - 1
    ] as [number, number]

    const recenter = () => {
        if (userLocation && cameraRef.current) {
            cameraRef.current.flyTo(
                [userLocation.coords.longitude, userLocation.coords.latitude],
                500
            )
            cameraRef.current.zoomTo(16, 500)
        }
    }

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

                    // socket.emit("locationUpdate", {
                    //     roomId,
                    //     id: user.id,
                    //     lat: locUpdate.coords.latitude,
                    //     lng: locUpdate.coords.longitude,
                    // })

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

                        // if (distanceToFinish < 100)
                        //     console.log("🚀 ~ Active ~ distanceToFinish:")
                        // socket.emit("finishLine", { roomId, id: user.id })
                    }
                }
            )
        })()

        return () => subscriber?.remove()
    }, [])

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

    // useEffect(() => {
    //     const socket = getSocket()
    //     if (!user || !session) return

    //     socket.emit("joinRoom", roomId, {
    //         id: user.id,
    //         name: user.full_name,
    //         role: "racer",
    //         bib: bibNumber,
    //     } as UserIdentity)

    //     socket.on("roomParticipants", (users: RaceUser[]) =>
    //         setParticipants(users)
    //     )

    //     socket.on(
    //         "locationUpdate",
    //         (data: { id: string; lat: number; lng: number }) => {
    //             setParticipants((prev) => {
    //                 const others = prev.filter((p) => p.id !== data.id)
    //                 const existing = prev.find((p) => p.id === data.id)
    //                 const updated: RaceUser = existing
    //                     ? {
    //                           ...existing,
    //                           state: {
    //                               ...existing.state,
    //                               lat: data.lat,
    //                               lng: data.lng,
    //                               lastUpdate: Date.now(),
    //                           },
    //                       }
    //                     : ({
    //                           id: data.id,
    //                           name: "User",
    //                           role: "racer",
    //                           state: {
    //                               lat: data.lat,
    //                               lng: data.lng,
    //                               finished: false,
    //                               lastUpdate: Date.now(),
    //                           },
    //                       } as RaceUser)

    //                 return [...others, updated]
    //             })
    //         }
    //     )

    //     return () => {
    //         socket.emit("leaveRoom", roomId)
    //         socket.off("roomParticipants")
    //         socket.off("locationUpdate")
    //     }
    // }, [roomId, user, session])

    return (
        <View style={styles.container}>
            <MapView
                style={StyleSheet.absoluteFillObject}
                attributionEnabled={false}
                mapStyle={MAP_STYLE_URL}
                ref={mapRef}
            >
                {userLocation && (
                    <PointAnnotation
                        id="self"
                        coordinate={[
                            userLocation.coords.longitude,
                            userLocation.coords.latitude,
                        ]}
                    >
                        <View style={styles.selfMarker}>
                            <Text style={styles.selfMarkerLabel}>You</Text>
                        </View>
                    </PointAnnotation>
                )}

                {participants
                    .filter((p) => p.id !== userId)
                    .map((p, i) => (
                        <PointAnnotation
                            key={p.id}
                            id={p.id}
                            coordinate={[p.state.lng, p.state.lat]}
                        >
                            <View style={styles.participantMarker}>
                                <Text style={styles.participantLabel}>
                                    {i + 1}
                                </Text>
                            </View>
                        </PointAnnotation>
                    ))}

                <Camera
                    ref={cameraRef}
                    zoomLevel={16}
                    animationMode="flyTo"
                    animationDuration={500}
                />

                {route?.geojson.features?.[0]?.geometry?.coordinates && (
                    <ShapeSource
                        id="routeLine"
                        shape={{
                            type: "Feature",
                            geometry: {
                                type: "LineString",
                                coordinates:
                                    route.geojson.features[0].geometry
                                        .coordinates,
                            },
                            properties: {},
                        }}
                    >
                        <LineLayer
                            id="routeLineLayer"
                            style={{ lineColor: "#2563EB", lineWidth: 4 }}
                        />
                    </ShapeSource>
                )}

                {route?.geojson.features?.[0]?.geometry?.coordinates
                    ?.length && (
                    <>
                        <PointAnnotation
                            id="start"
                            coordinate={
                                route.geojson.features[0].geometry
                                    .coordinates[0]
                            }
                        >
                            <View style={styles.startMarker} />
                        </PointAnnotation>

                        <PointAnnotation
                            id="finish"
                            coordinate={
                                route.geojson.features[0].geometry.coordinates[
                                    route.geojson.features[0].geometry
                                        .coordinates.length - 1
                                ]
                            }
                        >
                            <View style={styles.finishMarker} />
                        </PointAnnotation>
                    </>
                )}
            </MapView>

            <View style={styles.overlay}>
                <Text style={styles.title}>Room: {roomId}</Text>
                <TouchableOpacity
                    onPress={recenter}
                    style={{ marginBottom: 8 }}
                >
                    <Text style={{ color: "#007bff", fontWeight: "700" }}>
                        Recenter
                    </Text>
                </TouchableOpacity>

                <FlatList
                    data={participants}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.participant}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.coords}>
                                {item.state.lat.toFixed(5)},{" "}
                                {item.state.lng.toFixed(5)}
                            </Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.empty}>No participants yet</Text>
                    }
                />
            </View>
        </View>
    )
}

export default Active

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: {
        position: "absolute",
        top: 40,
        left: 16,
        right: 16,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 12,
        padding: 12,
        maxHeight: 300,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
    },
    participant: {
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    name: { fontSize: 14, fontWeight: "500" },
    coords: { fontSize: 12, color: "#555" },
    empty: { fontStyle: "italic", color: "#666", textAlign: "center" },
    selfMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#4CAF50",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    selfMarkerLabel: { fontSize: 10, fontWeight: "700", color: "#fff" },
    participantMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#f97316",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#fff",
    },
    participantLabel: { fontSize: 12, fontWeight: "700", color: "#fff" },
    startMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#28a745",
        borderWidth: 2,
        borderColor: "#fff",
    },
    finishMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#dc3545",
        borderWidth: 2,
        borderColor: "#fff",
    },
})
