import React, { useEffect, useRef, useState } from "react"
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button, Text, Surface } from "react-native-paper"
import MaterialIcons from "@react-native-vector-icons/material-icons"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from "react-native-reanimated"
import {
    Camera,
    CameraRef,
    CircleLayer,
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
import { RouteResponse, useRoutes } from "@/api/race"

const { width } = Dimensions.get("window")

export default function LiveRun() {
    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [time, setTime] = useState(0)
    const [distance, setDistance] = useState(0)
    const [followUser, setFollowUser] = useState(true)
    const [isRecentering, setIsRecentering] = useState(false)
    const [route, setRoute] = useState<Location.LocationObjectCoords[]>([])
    const [initialLoaded, setInitialLoaded] = useState(false)
    const [currentSpeed, setCurrentSpeed] = useState(0)

    const [plannedRoute, setPlannedRoute] = useState<RouteResponse | null>(null)
    const [showRoutes, setShowRoutes] = useState(false)

    const { data, isLoading, fetchNextPage, hasNextPage } = useRoutes()

    const watchSubRef = useRef<Location.LocationSubscription | null>(null)
    const cameraRef = useRef<CameraRef | null>(null)
    const mapRef = useRef<MapViewRef | null>(null)

    const { location, permissionStatus, requestPermission } = useLocation()
    const userLocation = location
        ? [location.coords.longitude, location.coords.latitude]
        : null

    // Pulsing animation
    const pulseAnim = useSharedValue(1)

    useEffect(() => {
        pulseAnim.value = withRepeat(
            withTiming(1.3, { duration: 1000, easing: Easing.ease }),
            -1,
            true
        )
    }, [])

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseAnim.value }],
    }))

    const [runStartTime, setRunStartTime] = useState<string | null>(null)
    const [runEndTime, setRunEndTime] = useState<string | null>(null)

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

        setRunStartTime(new Date().toISOString())

        watchSubRef.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Highest,
                timeInterval: 1000,
                distanceInterval: 2,
            },
            (pos) => {
                if (!isPaused) {
                    if (pos.coords.speed) {
                        setCurrentSpeed(pos.coords.speed * 3.6) // m/s to km/h
                    }

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

        setRunEndTime(new Date().toISOString())

        let savedUri: string | null = null
        if (mapRef.current) {
            try {
                savedUri = await mapRef.current.takeSnap(true)
            } catch (err) {
                console.warn("Failed to capture map snapshot", err)
            }
        }

        const summaryData = {
            name: plannedRoute?.name ?? "My Run",
            distance,
            time,
            pace: calculatePace(time, distance),
            route,
            map_image: savedUri ?? undefined,
            route_id: plannedRoute?.id,
            start_address: plannedRoute?.start_address,
            end_address: plannedRoute?.end_address,
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
    const plannedGeoJson = plannedRoute
        ? normalizePlannedRoute(plannedRoute)
        : null

    const progressPercentage = plannedRoute?.distance
        ? Math.min((distance / plannedRoute.distance) * 100, 100)
        : 0

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    attributionEnabled={false}
                    mapStyle={MAP_STYLE_URL}
                >
                    {/* Your route line */}

                    {/* Planned route line */}
                    {plannedGeoJson && (
                        <ShapeSource id="plannedRoute" shape={plannedGeoJson}>
                            <LineLayer
                                id="plannedRouteLine"
                                style={{
                                    lineColor: "#16a34a",
                                    lineWidth: 4,
                                    lineCap: "round",
                                    lineJoin: "round",
                                }}
                            />
                        </ShapeSource>
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
                                    lineColor: "#0891b2",
                                    lineWidth: 5,
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
                    />

                    {/* Start/End markers for planned route */}
                    {plannedGeoJson && plannedGeoJson.features.length > 0 && (
                        <ShapeSource
                            id="plannedRoutePoints"
                            shape={{
                                type: "FeatureCollection",
                                features: [
                                    {
                                        type: "Feature",
                                        geometry: {
                                            type: "Point",
                                            coordinates:
                                                plannedGeoJson.features[0]
                                                    .geometry.coordinates[0],
                                        },
                                        properties: { type: "start" },
                                    },
                                    {
                                        type: "Feature",
                                        geometry: {
                                            type: "Point",
                                            coordinates:
                                                plannedGeoJson.features[0]
                                                    .geometry.coordinates[
                                                    plannedGeoJson.features[0]
                                                        .geometry.coordinates
                                                        .length - 1
                                                ],
                                        },
                                        properties: { type: "end" },
                                    },
                                ],
                            }}
                        >
                            <CircleLayer
                                id="plannedRoutePointsLayer"
                                style={{
                                    circleColor: [
                                        "match",
                                        ["get", "type"],
                                        "start",
                                        "#16a34a",
                                        "end",
                                        "#dc2626",
                                        "#000000",
                                    ],
                                    circleRadius: 8,
                                    circleStrokeWidth: 3,
                                    circleStrokeColor: "#fff",
                                }}
                            />
                        </ShapeSource>
                    )}

                    {permissionStatus?.status === "granted" && userLocation && (
                        <UserLocation
                            animated
                            visible
                            showsUserHeadingIndicator={true}
                        />
                    )}
                </MapView>

                {/* Status Bar */}
                {isRunning && (
                    <View style={styles.statusBar}>
                        <LinearGradient
                            colors={[
                                "rgba(0, 0, 0, 0.8)",
                                "rgba(0, 0, 0, 0.6)",
                            ]}
                            style={styles.statusBarGradient}
                        >
                            <View style={styles.statusContent}>
                                {isPaused ? (
                                    <View style={styles.pausedBadge}>
                                        <MaterialIcons
                                            name="pause"
                                            size={16}
                                            color="#FFF"
                                        />
                                        <Text style={styles.pausedText}>
                                            PAUSED
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.liveBadge}>
                                        <Animated.View
                                            style={[styles.liveDot, pulseStyle]}
                                        />
                                        <Text style={styles.liveText}>
                                            RUNNING
                                        </Text>
                                    </View>
                                )}

                                {plannedRoute && (
                                    <Text
                                        style={styles.routeName}
                                        numberOfLines={1}
                                    >
                                        {plannedRoute.name}
                                    </Text>
                                )}
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* Floating Action Buttons */}
                <TouchableOpacity
                    style={styles.recenterButton}
                    onPress={handleToggleFollow}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={
                            followUser
                                ? ["#0891b2", "#16a34a"]
                                : ["#6B7280", "#4B5563"]
                        }
                        style={styles.fabGradient}
                    >
                        <MaterialIcons
                            name={followUser ? "gps-fixed" : "gps-not-fixed"}
                            size={24}
                            color="#FFF"
                        />
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.routeButton}
                    onPress={() => setShowRoutes(true)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={["#0891b2", "#16a34a"]}
                        style={styles.fabGradient}
                    >
                        <MaterialIcons name="route" size={24} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Stats Card */}
                {isRunning && (
                    <View style={styles.statsCard}>
                        <LinearGradient
                            colors={[
                                "rgba(255, 255, 255, 0.95)",
                                "rgba(255, 255, 255, 0.9)",
                            ]}
                            style={styles.statsGradient}
                        >
                            {/* Primary Stats */}
                            <View style={styles.primaryStats}>
                                <View style={styles.primaryStatItem}>
                                    <Text style={styles.primaryStatLabel}>
                                        DISTANCE
                                    </Text>
                                    <Text style={styles.primaryStatValue}>
                                        {distance.toFixed(2)}
                                    </Text>
                                    <Text style={styles.primaryStatUnit}>
                                        km
                                    </Text>
                                </View>

                                <View style={styles.statDivider} />

                                <View style={styles.primaryStatItem}>
                                    <Text style={styles.primaryStatLabel}>
                                        TIME
                                    </Text>
                                    <Text style={styles.primaryStatValue}>
                                        {formattedTime}
                                    </Text>
                                    <Text style={styles.primaryStatUnit}>
                                        elapsed
                                    </Text>
                                </View>

                                <View style={styles.statDivider} />

                                <View style={styles.primaryStatItem}>
                                    <Text style={styles.primaryStatLabel}>
                                        PACE
                                    </Text>
                                    <Text style={styles.primaryStatValue}>
                                        {calculatedPace}
                                    </Text>
                                    <Text style={styles.primaryStatUnit}>
                                        min/km
                                    </Text>
                                </View>
                            </View>

                            {/* Progress Bar (if planned route) */}
                            {plannedRoute && (
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressHeader}>
                                        <Text style={styles.progressLabel}>
                                            Route Progress
                                        </Text>
                                        <Text style={styles.progressPercentage}>
                                            {progressPercentage.toFixed(0)}%
                                        </Text>
                                    </View>
                                    <View style={styles.progressBarBg}>
                                        <LinearGradient
                                            colors={["#0891b2", "#16a34a"]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${progressPercentage}%`,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Secondary Stats */}
                            <View style={styles.secondaryStats}>
                                <LinearGradient
                                    colors={["#E0F2FE", "#BAE6FD"]}
                                    style={styles.secondaryStatBox}
                                >
                                    {/* <Text style={styles.secondaryStatIcon}>
                                        ⚡
                                    </Text> */}
                                    <Text style={styles.secondaryStatValue}>
                                        {currentSpeed.toFixed(1)}
                                    </Text>
                                    <Text style={styles.secondaryStatLabel}>
                                        km/h
                                    </Text>
                                </LinearGradient>

                                <LinearGradient
                                    colors={["#FEF3C7", "#FDE68A"]}
                                    style={styles.secondaryStatBox}
                                >
                                    {/* <Text style={styles.secondaryStatIcon}>
                                        🔥
                                    </Text> */}
                                    <Text style={styles.secondaryStatValue}>
                                        {Math.round(distance * 60)}
                                    </Text>
                                    <Text style={styles.secondaryStatLabel}>
                                        kcal
                                    </Text>
                                </LinearGradient>
                            </View>
                        </LinearGradient>
                    </View>
                )}
            </View>

            {/* Control Buttons */}
            <View style={styles.controls}>
                {!isRunning ? (
                    <TouchableOpacity
                        onPress={handleStartRun}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={["#0891b2", "#16a34a"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.startButton}
                        >
                            <MaterialIcons
                                name="play-arrow"
                                size={32}
                                color="#FFF"
                            />
                            <Text style={styles.controlButtonText}>
                                START RUN
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.controlRow}>
                        <TouchableOpacity
                            onPress={() => setIsPaused((p) => !p)}
                            activeOpacity={0.9}
                            style={{ flex: 1, marginRight: 8 }}
                        >
                            <LinearGradient
                                colors={
                                    isPaused
                                        ? ["#0891b2", "#16a34a"]
                                        : ["#f59e0b", "#d97706"]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.controlButton}
                            >
                                <MaterialIcons
                                    name={isPaused ? "play-arrow" : "pause"}
                                    size={28}
                                    color="#FFF"
                                />
                                <Text style={styles.controlButtonText}>
                                    {isPaused ? "RESUME" : "PAUSE"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleStopRun}
                            activeOpacity={0.9}
                            style={{ flex: 1, marginLeft: 8 }}
                        >
                            <LinearGradient
                                colors={["#dc2626", "#991b1b"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.controlButton}
                            >
                                <MaterialIcons
                                    name="stop"
                                    size={28}
                                    color="#FFF"
                                />
                                <Text style={styles.controlButtonText}>
                                    STOP
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Route Selection Sheet */}
            {showRoutes && (
                <View style={styles.routeSheet}>
                    <View style={styles.routeSheetHeader}>
                        <Text style={styles.routeSheetTitle}>SELECT ROUTE</Text>
                        <TouchableOpacity onPress={() => setShowRoutes(false)}>
                            <MaterialIcons
                                name="close"
                                size={28}
                                color="#111"
                            />
                        </TouchableOpacity>
                    </View>

                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>
                                Loading routes...
                            </Text>
                        </View>
                    )}

                    <ScrollView
                        style={styles.routeList}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        onScroll={({ nativeEvent }) => {
                            const {
                                layoutMeasurement,
                                contentOffset,
                                contentSize,
                            } = nativeEvent
                            if (
                                layoutMeasurement.height + contentOffset.y >=
                                    contentSize.height - 50 &&
                                hasNextPage
                            ) {
                                fetchNextPage()
                            }
                        }}
                        scrollEventThrottle={200}
                    >
                        {data?.pages.flat().map((r) => (
                            <TouchableOpacity
                                key={r.id}
                                style={styles.routeItem}
                                onPress={() => {
                                    setPlannedRoute(r)
                                    setShowRoutes(false)

                                    const coords =
                                        r.geojson.features[0].geometry
                                            .coordinates
                                    if (
                                        cameraRef.current &&
                                        coords.length > 1
                                    ) {
                                        cameraRef.current.fitBounds(
                                            coords[0],
                                            coords[coords.length - 1],
                                            80,
                                            1000
                                        )
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.routeRow}>
                                    {r.map_url ? (
                                        <View
                                            style={styles.routeImageContainer}
                                        >
                                            <Image
                                                source={{ uri: r.map_url }}
                                                style={styles.routeImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    ) : (
                                        <LinearGradient
                                            colors={["#0891b2", "#16a34a"]}
                                            style={styles.routeImagePlaceholder}
                                        >
                                            <MaterialIcons
                                                name="route"
                                                size={32}
                                                color="#FFF"
                                            />
                                        </LinearGradient>
                                    )}

                                    <View style={styles.routeText}>
                                        <Text
                                            style={styles.routeName}
                                            numberOfLines={1}
                                        >
                                            {r.name}
                                        </Text>
                                        <Text style={styles.routeDistance}>
                                            🏁 {(r.distance ?? 0).toFixed(2)} km
                                        </Text>

                                        {r.start_address && (
                                            <Text
                                                style={styles.routeAddress}
                                                numberOfLines={1}
                                            >
                                                📍 {r.start_address}
                                            </Text>
                                        )}
                                    </View>

                                    <MaterialIcons
                                        name="chevron-right"
                                        size={24}
                                        color="#9CA3AF"
                                    />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </SafeAreaView>
    )
}

function normalizePlannedRoute(route: RouteResponse) {
    if (!route.geojson.features.length) return null

    return {
        type: "FeatureCollection" as const,
        features: route.geojson.features.map((f) => ({
            type: "Feature" as const,
            geometry: {
                type: "LineString" as const,
                coordinates: f.geometry.coordinates.map((c) => [c[0], c[1]]),
            },
            properties: f.properties ?? {},
        })),
    }
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
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },

    // Status Bar
    statusBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    statusBarGradient: {
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    statusContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    liveBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(22, 163, 74, 0.9)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    pausedBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(245, 158, 11, 0.9)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FFF",
    },
    liveText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#FFF",
        letterSpacing: 0.5,
    },
    pausedText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#FFF",
        letterSpacing: 0.5,
    },
    routeName: {
        fontSize: 14,
        fontWeight: "600",
        // color: "#FFF",
        flex: 1,
    },

    // Floating Buttons
    recenterButton: {
        position: "absolute",
        top: 120,
        right: 20,
        borderRadius: 28,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    routeButton: {
        position: "absolute",
        top: 184,
        right: 20,
        borderRadius: 28,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabGradient: {
        width: 56,
        height: 56,
        alignItems: "center",
        justifyContent: "center",
    },

    // Stats Card
    statsCard: {
        position: "absolute",
        bottom: 120,
        left: 20,
        right: 20,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "rgba(0, 0, 0, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
    },
    statsGradient: {
        padding: 12,
    },
    primaryStats: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    primaryStatItem: {
        flex: 1,
        alignItems: "center",
    },
    primaryStatLabel: {
        fontSize: 8,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    primaryStatValue: {
        fontSize: 22,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: -0.5,
        lineHeight: 24,
    },
    primaryStatUnit: {
        fontSize: 9,
        fontWeight: "600",
        color: "#9CA3AF",
        marginTop: 1,
    },
    statDivider: {
        width: 1.5,
        height: 30,
        backgroundColor: "#E5E7EB",
        marginHorizontal: 2,
    },
    progressContainer: {
        marginBottom: 8,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    progressLabel: {
        fontSize: 9,
        fontWeight: "700",
        color: "#111827",
    },
    progressPercentage: {
        fontSize: 12,
        fontWeight: "900",
        color: "#0891b2",
    },
    progressBarBg: {
        height: 4,
        backgroundColor: "#E5E7EB",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 2,
    },
    secondaryStats: {
        flexDirection: "row",
        gap: 6,
    },
    secondaryStatBox: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 8,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "rgba(0, 0, 0, 0.05)",
    },
    secondaryStatIcon: {
        fontSize: 16,
        marginBottom: 2,
    },
    secondaryStatValue: {
        fontSize: 15,
        fontWeight: "900",
        color: "#111827",
        marginBottom: 1,
    },
    secondaryStatLabel: {
        fontSize: 8,
        fontWeight: "700",
        color: "#6B7280",
        textTransform: "uppercase",
    },

    // Controls
    controls: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFF",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
        borderTopWidth: 2,
        borderTopColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 12,
    },
    startButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        borderRadius: 12,
        gap: 8,
    },
    controlRow: {
        flexDirection: "row",
        gap: 0,
    },
    controlButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 6,
    },
    controlButtonText: {
        fontSize: 16,
        fontWeight: "900",
        color: "#FFF",
        letterSpacing: 0.5,
    },

    // Route Sheet
    routeSheet: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#FFF",
        zIndex: 30,
        paddingTop: 60,
    },
    routeSheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: "#E5E7EB",
    },
    routeSheetTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: -0.5,
    },
    loadingContainer: {
        padding: 40,
        alignItems: "center",
    },
    loadingText: {
        fontSize: 14,
        color: "#6B7280",
    },
    routeList: {
        flex: 1,
        paddingTop: 8,
    },
    routeItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    routeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    routeImageContainer: {
        width: 70,
        height: 70,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
    },
    routeImage: {
        width: "100%",
        height: "100%",
    },
    routeImagePlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    routeText: {
        flex: 1,
        gap: 4,
    },
    routeDistance: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
    },
    routeAddress: {
        fontSize: 12,
        color: "#9CA3AF",
    },
})
