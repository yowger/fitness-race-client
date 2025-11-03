import MaterialIcons from "@react-native-vector-icons/material-icons"
import {
    Camera,
    MapView,
    CameraRef,
    UserLocation,
} from "@maplibre/maplibre-react-native"
import * as Location from "expo-location"
import React, { useEffect, useRef, useState } from "react"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { Button, Text, Surface } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"

import { MAP_STYLE_URL } from "@/config/map"
import { formatTime, calculatePace } from "@/utils/formatters"
import { useBackgroundTracking } from "@/hooks/useBackgroundTracking"

export default function RunningTrackerScreen() {
    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [time, setTime] = useState(0)
    const [distance, setDistance] = useState(0)
    const [followUser, setFollowUser] = useState(true)
    const [userLocation, setUserLocation] = useState<[number, number] | null>(
        null
    )
    const cameraRef = useRef<CameraRef | null>(null)

    useEffect(() => {
        let headingSub: Location.LocationSubscription | null = null

        ;(async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync()
            if (status !== "granted") return

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            })

            setUserLocation([
                location.coords.longitude,
                location.coords.latitude,
            ])

            headingSub = await Location.watchHeadingAsync((heading) => {
                if (cameraRef.current && followUser) {
                    cameraRef.current.setCamera({
                        heading: heading.trueHeading,
                        animationDuration: 300,
                    })
                }
            })
        })()

        return () => headingSub?.remove()
    }, [followUser])

    useEffect(() => {
        if (userLocation && cameraRef.current) {
            cameraRef.current.flyTo(userLocation, 1000)
        }
    }, [userLocation])

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>

        if (isRunning && !isPaused) {
            interval = setInterval(() => {
                setTime((prev) => prev + 1)
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [isRunning, isPaused])

    useBackgroundTracking(({ latitude, longitude }) => {
        setUserLocation([longitude, latitude])
    })

    const formattedTime = formatTime(time)
    const calculatedPace = calculatePace(time, distance)

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    attributionEnabled={false}
                    mapStyle={MAP_STYLE_URL}
                >
                    <UserLocation animated visible showsUserHeadingIndicator />

                    <Camera
                        ref={cameraRef}
                        zoomLevel={16}
                        animationMode="flyTo"
                        animationDuration={1000}
                        followUserLocation={followUser}
                    />
                </MapView>

                <TouchableOpacity
                    style={styles.recenterIcon}
                    onPress={() => {
                        if (userLocation && cameraRef.current) {
                            cameraRef.current.flyTo(userLocation, 800)
                            setFollowUser((prev) => !prev)
                        }
                    }}
                >
                    <MaterialIcons
                        name={followUser ? "directions-walk" : "my-location"}
                        size={28}
                        color="#007bff"
                    />
                </TouchableOpacity>

                {isRunning && (
                    <Surface style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={styles.label}>Distance</Text>
                                <Text style={styles.value}>
                                    {distance.toFixed(2)}
                                </Text>
                                <Text style={styles.subLabel}>km</Text>
                            </View>

                            <View style={styles.stat}>
                                <Text style={styles.label}>Time</Text>
                                <Text style={styles.value}>
                                    {formattedTime}
                                </Text>
                                <Text style={styles.subLabel}>duration</Text>
                            </View>

                            <View style={styles.stat}>
                                <Text style={styles.label}>Pace</Text>
                                <Text style={styles.value}>
                                    {calculatedPace}
                                </Text>
                                <Text style={styles.subLabel}>min/km</Text>
                            </View>
                        </View>
                    </Surface>
                )}
            </View>

            <View style={styles.controls}>
                {!isRunning ? (
                    <Button
                        mode="contained"
                        onPress={() => {
                            setIsRunning(true)
                            setIsPaused(false)
                        }}
                        style={isRunning ? styles.startBtn : styles.resetBtn}
                        labelStyle={styles.btnText}
                    >
                        Start Run
                    </Button>
                ) : (
                    <View style={styles.row}>
                        <Button
                            mode="contained"
                            onPress={() => setIsPaused(!isPaused)}
                            style={isPaused ? styles.startBtn : styles.pauseBtn}
                            labelStyle={styles.btnText}
                        >
                            {isPaused ? "Resume" : "Pause"}
                        </Button>

                        <Button
                            mode="contained"
                            onPress={() => {
                                setIsRunning(false)
                                setIsPaused(false)
                                setTime(0)
                                setDistance(0)
                            }}
                            style={styles.stopBtn}
                            labelStyle={styles.btnText}
                        >
                            Stop
                        </Button>
                    </View>
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#111" },
    map: { flex: 1 },
    mapContainer: { flex: 1 },
    statsCard: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        width: "90%",
        padding: 16,
        borderRadius: 16,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    stat: { alignItems: "center" },
    value: { fontSize: 28, fontWeight: "bold" },
    label: { fontSize: 14 },
    subLabel: { fontSize: 10 },
    controls: {
        padding: 20,
        paddingBottom: 30,
    },
    row: { flexDirection: "row", gap: 10 },
    resetBtn: { backgroundColor: "#28a745", paddingVertical: 12 },
    startBtn: { flex: 1, backgroundColor: "#28a745", paddingVertical: 12 },
    pauseBtn: { flex: 1, backgroundColor: "#f0ad4e", paddingVertical: 12 },
    stopBtn: { flex: 1, backgroundColor: "#d9534f", paddingVertical: 12 },
    btnText: { fontSize: 18, fontWeight: "bold" },
    recenterIcon: {
        position: "absolute",
        bottom: 125,
        right: 20,
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 50,
        elevation: 5,
    },
})
