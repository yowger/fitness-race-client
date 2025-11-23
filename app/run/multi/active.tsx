import {
    Camera,
    CameraRef,
    CircleLayer,
    LineLayer,
    Logger,
    MapView,
    MapViewRef,
    MarkerView,
    PointAnnotation,
    ShapeSource,
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
import { useProfile } from "../../../api/user"

type Participant = {
    id: string
    lat?: number
    lng?: number
    name?: string
}

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

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

const Active = () => {
    const { data: user } = useProfile()

    const { data: route } = useRoute("7a6f818a-bd09-4ef2-b6d2-2bf49111df65")
    const { session } = useAuth()
    const { roomId } = useLocalSearchParams()
    const [participants, setParticipants] = useState<Participant[]>([])
    const [userLocation, setUserLocation] =
        useState<Location.LocationObject | null>(null)
    const mapRef = useRef<MapViewRef>(null)
    const cameraRef = useRef<CameraRef>(null)

    const userId = session?.user.id

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
            if (status !== "granted") {
                console.warn("Location permission not granted")
                return
            }

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            })

            setUserLocation(loc)

            subscriber = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.Highest, distanceInterval: 1 },
                (locUpdate) => {
                    setUserLocation(locUpdate)

                    const socket = getSocket()

                    socket.emit("locationUpdate", {
                        id: userId,
                        roomId,
                        lat: locUpdate.coords.latitude,
                        lng: locUpdate.coords.longitude,
                    })

                    if (finish) {
                        const userPos: [number, number] = [
                            locUpdate.coords.longitude,
                            locUpdate.coords.latitude,
                        ]
                        const distanceToFinish = haversineDistance(
                            userPos,
                            finish
                        )

                        if (distanceToFinish < 10) {
                            socket.emit("finishLine", { userId, roomId })
                        }
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

    useEffect(() => {
        const socket = getSocket()

        socket.on("roomParticipants", (users: Participant[]) => {
            setParticipants(users)
        })

        socket.on(
            "locationUpdate",
            (data: { id: string; lat: number; lng: number }) => {
                setParticipants((prev) => {
                    const others = prev.filter((p) => p.id !== data.id)
                    const existing = prev.find((p) => p.id === data.id)
                    const updated = existing ? { ...existing, ...data } : data
                    return [...others, updated]
                })
            }
        )

        return () => {
            socket.emit("leaveRoom", roomId)
            socket.off("roomParticipants")
            socket.off("locationUpdate")
        }
    }, [roomId])

    useEffect(() => {
        const socket = getSocket()

        if (!user || !session) return

        const name = user.full_name

        socket.emit("joinRoom", roomId, { name: name })
    }, [session, roomId, user])

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
                    .map(
                        (p, i) =>
                            p.lat &&
                            p.lng && (
                                <PointAnnotation
                                    key={p.id}
                                    id={p.id}
                                    coordinate={[p.lng, p.lat]}
                                >
                                    <View style={styles.participantMarker}>
                                        <Text style={styles.participantLabel}>
                                            {i + 1}
                                        </Text>
                                    </View>
                                </PointAnnotation>
                            )
                    )}

                <Camera
                    ref={cameraRef}
                    zoomLevel={16}
                    animationMode="flyTo"
                    animationDuration={500}
                />

                {route?.geojson.features?.[0]?.geometry?.coordinates && (
                    <>
                        <ShapeSource
                            id="routeLine"
                            shape={{
                                type: "Feature",
                                properties: {},
                                geometry: {
                                    type: "LineString",
                                    coordinates:
                                        route.geojson.features[0].geometry
                                            .coordinates,
                                },
                            }}
                        >
                            <LineLayer
                                id="routeLineLayer"
                                style={{
                                    lineColor: "#2563EB",
                                    lineWidth: 4,
                                }}
                            />
                        </ShapeSource>

                        <ShapeSource
                            id="routeEndpoints"
                            shape={{
                                type: "FeatureCollection",
                                features: [
                                    {
                                        type: "Feature",
                                        geometry: {
                                            type: "Point",
                                            coordinates:
                                                route.geojson.features[0]
                                                    .geometry.coordinates[0],
                                        },
                                        properties: { type: "start" },
                                    },
                                    {
                                        type: "Feature",
                                        geometry: {
                                            type: "Point",
                                            coordinates:
                                                route.geojson.features[0]
                                                    .geometry.coordinates[
                                                    route.geojson.features[0]
                                                        .geometry.coordinates
                                                        .length - 1
                                                ],
                                        },
                                        properties: { type: "finish" },
                                    },
                                ],
                            }}
                        >
                            <CircleLayer
                                id="endpointsLayer"
                                style={{
                                    circleRadius: 6,
                                    circleColor: [
                                        "match",
                                        ["get", "type"],
                                        "start",
                                        "#10B981",
                                        "finish",
                                        "#EF4444",
                                        "#000000",
                                    ],
                                    circleStrokeWidth: 2,
                                    circleStrokeColor: "#fff",
                                }}
                            />
                        </ShapeSource>
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

                <View style={styles.listContainer}>
                    {participants.length === 0 ? (
                        <Text style={styles.empty}>No participants yet</Text>
                    ) : (
                        <FlatList
                            data={participants}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.participant}>
                                    <Text style={styles.name}>
                                        {item.name || "User"}
                                    </Text>
                                    {item.lat !== undefined &&
                                        item.lng !== undefined && (
                                            <Text style={styles.coords}>
                                                {item.lat.toFixed(5)},{" "}
                                                {item.lng.toFixed(5)}
                                            </Text>
                                        )}
                                </View>
                            )}
                        />
                    )}
                </View>
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
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        maxHeight: 300,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
    },
    listContainer: {
        flexGrow: 1,
        maxHeight: 240,
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
    selfMarkerLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#fff",
        backgroundColor: "red",
        paddingHorizontal: 4,
        borderRadius: 4,
    },

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
})
