import {
    Camera,
    CameraRef,
    MapView,
    MapViewRef,
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
    const mapRef = useRef<MapViewRef>(null)
    const cameraRef = useRef<CameraRef>(null)
    const userId = session?.user.id

    const { location, permissionStatus, requestPermission } = useLocation()

    const recenter = () => {
        if (location && cameraRef.current) {
            cameraRef.current.flyTo(
                [location.coords.longitude, location.coords.latitude],
                500
            )
            cameraRef.current.zoomTo(16, 500)
        }
    }

    useEffect(() => {
        ;(async () => {
            if (!permissionStatus || permissionStatus.status !== "granted") {
                const { status } = await requestPermission()
                if (status !== "granted") {
                    console.warn("Location permission not granted")
                    return
                }
            }

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            })

            if (loc && cameraRef.current) {
  cameraRef.current.setCamera({
    centerCoordinate: [loc.coords.longitude, loc.coords.latitude],
    zoomLevel: 16,
    animationDuration: 1000,
  });
}
        })()
    }, [permissionStatus])

    useEffect(() => {
        const socket = getSocket()

        const username = session?.user.email || "Anonymous"
        socket.emit("joinRoom", roomId, { name: username })

        socket.on("roomParticipants", (users: Participant[]) => {
            console.log("🚀 ~ Active ~ users:", users)
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

    return (
        <View style={styles.container}>
            <MapView
                style={StyleSheet.absoluteFillObject}
                attributionEnabled={false}
                mapStyle={MAP_STYLE_URL}
                ref={mapRef}
            >
                {participants
                    .filter((p) => p.id !== userId)
                    .map(
                        (p) =>
                            p.lat &&
                            p.lng && (
                                <PointAnnotation
                                    key={p.id}
                                    id={p.id}
                                    coordinate={[p.lng, p.lat]}
                                >
                                    <View style={styles.marker}>
                                        <View style={styles.markerDot} />
                                        <Text style={styles.markerLabel}>
                                            {p.name || "User"}
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
    marker: { alignItems: "center" },
    markerDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#f97316",
        borderWidth: 2,
        borderColor: "#fff",
    },
    markerLabel: {
        fontSize: 10,
        fontWeight: "500",
        color: "#111",
        backgroundColor: "rgba(255,255,255,0.8)",
        paddingHorizontal: 4,
        borderRadius: 4,
        marginTop: 2,
    },
})
