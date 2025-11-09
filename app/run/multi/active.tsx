import {
    Camera,
    CameraRef,
    Logger,
    MapView,
    MapViewRef,
    MarkerView,
    PointAnnotation,
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
import { useLocation } from "@/hooks/useLocation"
import { useAuth } from "@/providers/AuthProvider"

type Participant = {
    id: string
    lat?: number
    lng?: number
    name?: string
}

const Active = () => {
    const { session } = useAuth()
    const { roomId } = useLocalSearchParams()
    const [participants, setParticipants] = useState<Participant[]>([])
    const [userLocation, setUserLocation] =
        useState<Location.LocationObject | null>(null)
    const mapRef = useRef<MapViewRef>(null)
    const cameraRef = useRef<CameraRef>(null)

    const userId = session?.user.id

    const recenter = () => {
        if (userLocation && cameraRef.current) {
            cameraRef.current.flyTo(
                [userLocation.coords.longitude, userLocation.coords.latitude],
                500
            )
            cameraRef.current.zoomTo(16, 500)
        }
    }

    // subscribe to user location
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
                (locUpdate) => setUserLocation(locUpdate)
            )
        })()

        return () => subscriber?.remove()
    }, [])

    // set camera to user location on start
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
            console.log("🚀 EMITTING USERS", users)
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

        if (!session?.user) return

        const username = session.user.email
        console.log("username: ", username)
        socket.emit("joinRoom", roomId, { name: username })
    }, [session, roomId])

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
