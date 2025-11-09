import React, { useEffect, useRef, useState } from "react"
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button, Text, Surface } from "react-native-paper"
import MaterialIcons from "@react-native-vector-icons/material-icons"
import {
    Camera,
    CameraRef,
    LineLayer,
    MapView,
    MapViewRef,
    ShapeSource,
    UserLocation,
} from "@maplibre/maplibre-react-native"
import * as Location from "expo-location"

import { MAP_STYLE_URL } from "@/config/map"
import { useLocation } from "@/hooks/useLocation"
import { formatTime, calculatePace } from "@/utils/formatters"
import { router } from "expo-router"

export default function RunningTrackerScreen() {
    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [time, setTime] = useState(0)
    const [distance, setDistance] = useState(0)
    const [followUser, setFollowUser] = useState(true)
    const [isRecentering, setIsRecentering] = useState(false)
    const [route, setRoute] = useState<Location.LocationObjectCoords[]>([])
    const [initialLoaded, setInitialLoaded] = useState(false)

    const watchSubRef = useRef<Location.LocationSubscription | null>(null)
    const cameraRef = useRef<CameraRef | null>(null)
    const mapRef = useRef<MapViewRef | null>(null)

    const { location, permissionStatus, requestPermission } = useLocation()
    const userLocation = location
        ? [location.coords.longitude, location.coords.latitude]
        : null

    useEffect(() => {
        ;(async () => {
            if (!permissionStatus || permissionStatus.status !== "granted") {
                const { status } = await requestPermission()
                if (status !== "granted") {
                    Alert.alert(
                        "Permission Required",
                        "We need your location to track your run."
                    )
                    return
                }
            }

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
            setInitialLoaded(true)
        })()
    }, [permissionStatus])

    useEffect(() => {
        if (!isRunning || isPaused) return
        const timer = setInterval(() => setTime((t) => t + 1), 1000)
        return () => clearInterval(timer)
    }, [isRunning, isPaused])

    useEffect(() => {
        if (userLocation && cameraRef.current && followUser) {
            cameraRef.current.flyTo(userLocation, 1000)
        }
    }, [userLocation, followUser])

    useEffect(() => {
        return () => watchSubRef.current?.remove()
    }, [])

    const handleStartRun = async () => {
        if (!initialLoaded) return

        watchSubRef.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Highest,
                timeInterval: 1000,
                distanceInterval: 2,
            },
            (pos) => {
                if (!isPaused) {
                    setRoute((prev) => {
                        let segmentDistance = 0
                        if (prev.length > 0) {
                            const last = prev[prev.length - 1]
                            segmentDistance =
                                getDistanceFromLatLonInMeters(
                                    last.latitude,
                                    last.longitude,
                                    pos.coords.latitude,
                                    pos.coords.longitude
                                ) / 1000
                            setDistance((d) => d + segmentDistance)
                        }
                        return [...prev, pos.coords]
                    })
                }
            }
        )

        setIsRunning(true)
        setIsPaused(false)
    }

    const handleStopRun = async () => {
        watchSubRef.current?.remove()
        watchSubRef.current = null
        setIsRunning(false)
        setIsPaused(false)

        if (route.length < 3 || distance < 0.02) {
            Alert.alert(
                "Not Enough Data",
                "Your run was too short to record. Try running a bit farther!"
            )

            setTime(0)
            setDistance(0)
            setRoute([])
            return
        }

        let savedUri: string | null = null
        if (mapRef.current) {
            try {
                savedUri = await mapRef.current.takeSnap(true)
            } catch (err) {
                console.warn("Failed to capture map snapshot", err)
            }
        }

        const summaryData = {
            distance,
            time,
            pace: calculatePace(time, distance),
            route,
            mapImage: savedUri,
        }

        router.push({
            pathname: "/run/single/summary",
            params: { summary: JSON.stringify(summaryData) },
        })

        setTime(0)
        setDistance(0)
        setRoute([])
    }

    const handleToggleFollow = () => {
        if (isRecentering) return
        setIsRecentering(true)
        if (userLocation && cameraRef.current) {
            cameraRef.current.flyTo(userLocation, 800)
            setFollowUser((prev) => !prev)
        }
        setTimeout(() => setIsRecentering(false), 500)
    }

    const formattedTime = formatTime(time)
    const calculatedPace = calculatePace(time, distance)

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.infoBox}>
                {userLocation && (
                    <>
                        <Text style={styles.infoText}>
                            Lat: {userLocation[1].toFixed(6)}
                        </Text>
                        <Text style={styles.infoText}>
                            Lon: {userLocation[0].toFixed(6)}
                        </Text>
                    </>
                )}
                <Text style={styles.infoText}>
                    Distance: {distance.toFixed(2)} km
                </Text>
                <Text style={styles.infoText}>Time: {formattedTime}</Text>
                <Text style={styles.infoText}>
                    Pace: {calculatedPace} min/km
                </Text>
            </View>

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    attributionEnabled={false}
                    mapStyle={MAP_STYLE_URL}
                >
                    {permissionStatus?.status === "granted" && userLocation && (
                        <UserLocation
                            animated
                            visible
                            showsUserHeadingIndicator={false}
                        />
                    )}

                    {route.length > 1 && (
                        <ShapeSource
                            id="route"
                            shape={{
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: route.map((c) => [
                                        c.longitude,
                                        c.latitude,
                                    ]),
                                },
                                properties: {},
                            }}
                        >
                            <LineLayer
                                id="routeLine"
                                style={{
                                    lineColor: "#007bff",
                                    lineWidth: 4,
                                    lineCap: "round",
                                    lineJoin: "round",
                                }}
                            />
                        </ShapeSource>
                    )}

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
                    onPress={handleToggleFollow}
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
                            <Stat
                                label="Distance"
                                value={distance.toFixed(2)}
                                sub="km"
                            />
                            <Stat
                                label="Time"
                                value={formattedTime}
                                sub="duration"
                            />
                            <Stat
                                label="Pace"
                                value={calculatedPace}
                                sub="min/km"
                            />
                        </View>
                    </Surface>
                )}
            </View>

            <View style={styles.controls}>
                {!isRunning ? (
                    <Button
                        mode="contained"
                        onPress={handleStartRun}
                        style={isRunning ? styles.startBtn : styles.resetBtn}
                        labelStyle={styles.btnText}
                    >
                        Start Run
                    </Button>
                ) : (
                    <View style={styles.row}>
                        <Button
                            mode="contained"
                            onPress={() => setIsPaused((p) => !p)}
                            style={isPaused ? styles.startBtn : styles.pauseBtn}
                            labelStyle={styles.btnText}
                        >
                            {isPaused ? "Resume" : "Pause"}
                        </Button>

                        <Button
                            mode="contained"
                            onPress={handleStopRun}
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

function Stat({
    label,
    value,

    sub,
}: {
    label: string
    value: string
    sub: string
}) {
    return (
        <View style={styles.stat}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.subLabel}>{sub}</Text>
        </View>
    )
}

function getDistanceFromLatLonInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#111" },
    infoBox: {
        position: "absolute",
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: 10,
        borderRadius: 10,
        zIndex: 10,
    },
    infoText: {
        color: "#fff",
        fontSize: 12,
        marginBottom: 2,
    },
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
    statsRow: { flexDirection: "row", justifyContent: "space-between" },
    stat: { alignItems: "center" },
    value: { fontSize: 28, fontWeight: "bold" },
    label: { fontSize: 14 },
    subLabel: { fontSize: 10 },
    controls: { padding: 20, paddingBottom: 30 },
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
