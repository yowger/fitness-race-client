import React, { useRef, useEffect } from "react"
import {
    View,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
    Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Text } from "react-native-paper"
import { LinearGradient } from "expo-linear-gradient"
import MaterialIcons from "@react-native-vector-icons/material-icons"
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated"
import {
    MapView,
    Camera,
    CameraRef,
    ShapeSource,
    LineLayer,
    CircleLayer,
    UserLocation,
    MapViewRef,
} from "@maplibre/maplibre-react-native"
import { useRun, useDeleteRun } from "@/api/runs"
import { MAP_STYLE_URL } from "@/config/map"
import { useLocalSearchParams, useRouter } from "expo-router"

const { width, height } = Dimensions.get("window")

export default function RunDetail() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const { data: run, isLoading, error } = useRun(id)
    const { mutate: deleteRun, isPending: isDeleting } = useDeleteRun()
    const mapRef = useRef<MapViewRef>(null)
    const cameraRef = useRef<CameraRef>(null)

    const handleDelete = () => {
        Alert.alert("Delete Run?", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    deleteRun(id!, {
                        onSuccess: () => {
                            router.back()
                        },
                        onError: (err: any) => {
                            Alert.alert(
                                "Error",
                                err.message || "Failed to delete run"
                            )
                        },
                    })
                },
            },
        ])
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={["#0891b2", "#16a34a"]}
                    style={styles.loadingGradient}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.loadingText}>LOADING RUN...</Text>
            </View>
        )
    }

    if (error || !run) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.errorIcon}>
                    <Text style={styles.errorIconText}>⚠️</Text>
                </View>
                <Text style={styles.errorTitle}>Run Not Found</Text>
                <Text style={styles.errorText}>
                    {error?.message || "This run could not be loaded"}
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={["#0891b2", "#16a34a"]}
                        style={styles.backButton}
                    >
                        <MaterialIcons
                            name="arrow-back"
                            size={20}
                            color="#FFF"
                        />
                        <Text style={styles.backButtonText}>GO BACK</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        )
    }

    let routeCoordinates: [number, number][] = []
    if (run.route) {
        try {
            const parsedRoute =
                typeof run.route === "string"
                    ? JSON.parse(run.route)
                    : run.route
            if (Array.isArray(parsedRoute)) {
                routeCoordinates = parsedRoute.map((p: any) => [
                    p.longitude,
                    p.latitude,
                ])
            }
        } catch (e) {
            console.warn("Failed to parse route:", e)
        }
    }

    const startPoint = routeCoordinates[0]
    const endPoint = routeCoordinates[routeCoordinates.length - 1]

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View
                    entering={FadeInDown.delay(100)}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButtonSmall}
                        >
                            <MaterialIcons
                                name="arrow-back"
                                size={24}
                                color="#111827"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleDelete}
                            style={styles.deleteButton}
                            disabled={isDeleting}
                        >
                            <MaterialIcons
                                name={
                                    isDeleting
                                        ? "hourglass-empty"
                                        : "delete-outline"
                                }
                                size={24}
                                color="#dc2626"
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.titleContainer}>
                        <LinearGradient
                            colors={["#0891b2", "#16a34a"]}
                            style={styles.titleIcon}
                        >
                            <MaterialIcons
                                name="directions-run"
                                size={32}
                                color="#FFF"
                            />
                        </LinearGradient>
                        <View style={styles.titleContent}>
                            <Text style={styles.title} numberOfLines={2}>
                                {run.name}
                            </Text>
                            <Text style={styles.subtitle}>
                                {new Date(run.created_at).toLocaleDateString(
                                    "en-US",
                                    {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }
                                )}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Stats Grid */}
                <Animated.View
                    entering={FadeInDown.delay(200)}
                    style={styles.statsGrid}
                >
                    <LinearGradient
                        colors={["#E0F2FE", "#BAE6FD"]}
                        style={styles.statCard}
                    >
                        <MaterialIcons
                            name="straighten"
                            size={28}
                            color="#0891b2"
                        />
                        <Text style={styles.statValue}>
                            {run.distance.toFixed(2)}
                        </Text>
                        <Text style={styles.statUnit}>km</Text>
                        <Text style={styles.statLabel}>DISTANCE</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={["#DCFCE7", "#BBF7D0"]}
                        style={styles.statCard}
                    >
                        <MaterialIcons
                            name="schedule"
                            size={28}
                            color="#16a34a"
                        />
                        <Text style={styles.statValue}>
                            {formatTime(run.time)}
                        </Text>
                        <Text style={styles.statUnit}>time</Text>
                        <Text style={styles.statLabel}>DURATION</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={["#FEF3C7", "#FDE68A"]}
                        style={styles.statCard}
                    >
                        <MaterialIcons name="speed" size={28} color="#d97706" />
                        <Text style={styles.statValue}>{run.pace}</Text>
                        <Text style={styles.statUnit}>min/km</Text>
                        <Text style={styles.statLabel}>AVG PACE</Text>
                    </LinearGradient>
                </Animated.View>

                {/* Additional Stats */}
                <Animated.View
                    entering={FadeInDown.delay(300)}
                    style={styles.additionalStats}
                >
                    <LinearGradient
                        colors={["#F3E8FF", "#E9D5FF"]}
                        style={styles.additionalStatCard}
                    >
                        <MaterialIcons
                            name="local-fire-department"
                            size={32}
                            color="#9333ea"
                        />
                        <View style={styles.additionalStatContent}>
                            <Text style={styles.additionalStatValue}>
                                {Math.round(run.distance * 60)}
                            </Text>
                            <Text style={styles.additionalStatLabel}>
                                Calories Burned
                            </Text>
                        </View>
                    </LinearGradient>

                    <LinearGradient
                        colors={["#FEE2E2", "#FECACA"]}
                        style={styles.additionalStatCard}
                    >
                        <MaterialIcons name="route" size={32} color="#dc2626" />
                        <View style={styles.additionalStatContent}>
                            <Text style={styles.additionalStatValue}>
                                {routeCoordinates.length}
                            </Text>
                            <Text style={styles.additionalStatLabel}>
                                GPS Points
                            </Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Map Section */}
                <Animated.View
                    entering={FadeInUp.delay(400)}
                    style={styles.mapSection}
                >
                    <View style={styles.mapHeader}>
                        <View style={styles.mapHeaderLeft}>
                            <View style={styles.mapIconBadge}>
                                <MaterialIcons
                                    name="map"
                                    size={20}
                                    color="#0891b2"
                                />
                            </View>
                            <Text style={styles.sectionTitle}>Route Map</Text>
                        </View>
                    </View>

                    <View style={styles.mapContainer}>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            mapStyle={MAP_STYLE_URL}
                            attributionEnabled={false}
                        >
                            {/* <Camera ref={cameraRef} zoomLevel={14} /> */}

                            {routeCoordinates.length > 1 && (
                                <ShapeSource
                                    id="route"
                                    shape={{
                                        type: "Feature",
                                        geometry: {
                                            type: "LineString",
                                            coordinates: routeCoordinates,
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

                            {startPoint && endPoint && (
                                <ShapeSource
                                    id="points"
                                    shape={{
                                        type: "FeatureCollection",
                                        features: [
                                            {
                                                type: "Feature",
                                                geometry: {
                                                    type: "Point",
                                                    coordinates: startPoint,
                                                },
                                                properties: { type: "start" },
                                            },
                                            {
                                                type: "Feature",
                                                geometry: {
                                                    type: "Point",
                                                    coordinates: endPoint,
                                                },
                                                properties: { type: "end" },
                                            },
                                        ],
                                    }}
                                >
                                    <CircleLayer
                                        id="pointsLayer"
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
                                            circleRadius: 10,
                                            circleStrokeWidth: 3,
                                            circleStrokeColor: "#fff",
                                        }}
                                    />
                                </ShapeSource>
                            )}

                            {/* <UserLocation
                                visible
                                animated
                                showsUserHeadingIndicator
                            /> */}
                        </MapView>
                    </View>

                    {/* Map Legend */}
                    <View style={styles.mapLegend}>
                        <View style={styles.legendItem}>
                            <View style={styles.startMarkerLegend} />
                            <Text style={styles.legendText}>Start</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={styles.routeLineLegend} />
                            <Text style={styles.legendText}>Route</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={styles.finishMarkerLegend} />
                            <Text style={styles.legendText}>Finish</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Location Details */}
                {(run.start_address || run.end_address) && (
                    <Animated.View
                        entering={FadeInDown.delay(500)}
                        style={styles.locationSection}
                    >
                        <View style={styles.locationHeader}>
                            <View style={styles.locationIconBadge}>
                                <MaterialIcons
                                    name="location-on"
                                    size={20}
                                    color="#0891b2"
                                />
                            </View>
                            <Text style={styles.sectionTitle}>Locations</Text>
                        </View>

                        <View style={styles.locationContent}>
                            {run.start_address && (
                                <View style={styles.locationItem}>
                                    <View style={styles.locationMarker}>
                                        <View style={styles.startMarker}>
                                            <MaterialIcons
                                                name="play-arrow"
                                                size={12}
                                                color="#FFF"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.locationText}>
                                        <Text style={styles.locationLabel}>
                                            START POINT
                                        </Text>
                                        <Text style={styles.locationAddress}>
                                            {run.start_address}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {run.start_address && run.end_address && (
                                <View style={styles.locationDivider} />
                            )}

                            {run.end_address && (
                                <View style={styles.locationItem}>
                                    <View style={styles.locationMarker}>
                                        <View style={styles.endMarker}>
                                            <MaterialIcons
                                                name="flag"
                                                size={12}
                                                color="#FFF"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.locationText}>
                                        <Text style={styles.locationLabel}>
                                            FINISH POINT
                                        </Text>
                                        <Text style={styles.locationAddress}>
                                            {run.end_address}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    )
}

function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    container: {
        paddingBottom: 20,
    },

    // Header
    header: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 2,
        borderBottomColor: "#E5E7EB",
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    backButtonSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FEE2E2",
        alignItems: "center",
        justifyContent: "center",
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    titleIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    titleContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "600",
    },

    // Stats
    statsGrid: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "rgba(0, 0, 0, 0.05)",
    },
    statValue: {
        fontSize: 22,
        fontWeight: "900",
        color: "#111827",
        marginTop: 8,
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    statUnit: {
        fontSize: 10,
        color: "#6B7280",
        marginBottom: 6,
        fontWeight: "600",
    },
    statLabel: {
        fontSize: 8,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 0.5,
    },

    // Additional Stats
    additionalStats: {
        flexDirection: "row",
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
    },
    additionalStatCard: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "rgba(0, 0, 0, 0.05)",
    },
    additionalStatContent: {
        flex: 1,
    },
    additionalStatValue: {
        fontSize: 18,
        fontWeight: "900",
        color: "#111827",
        marginBottom: 2,
    },
    additionalStatLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#6B7280",
        textTransform: "uppercase",
    },

    // Map Section
    mapSection: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 20,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        marginBottom: 20,
    },
    mapHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    mapHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    mapIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#E0F2FE",
        alignItems: "center",
        justifyContent: "center",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: -0.3,
    },
    mapContainer: {
        height: 300,
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#D1D5DB",
    },
    map: {
        flex: 1,
    },
    mapLegend: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: "#E5E7EB",
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    startMarkerLegend: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#16a34a",
        borderWidth: 2,
        borderColor: "#fff",
    },
    routeLineLegend: {
        width: 24,
        height: 4,
        backgroundColor: "#0891b2",
        borderRadius: 2,
    },
    finishMarkerLegend: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#dc2626",
        borderWidth: 2,
        borderColor: "#fff",
    },
    legendText: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },

    // Location Section
    locationSection: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 20,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    locationHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    locationIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#E0F2FE",
        alignItems: "center",
        justifyContent: "center",
    },
    locationContent: {
        gap: 0,
    },
    locationItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 12,
    },
    locationMarker: {
        width: 32,
        alignItems: "center",
        paddingTop: 2,
    },
    startMarker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#16a34a",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#FFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    endMarker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#dc2626",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#FFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    locationText: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 10,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 14,
        color: "#111827",
        lineHeight: 20,
        fontWeight: "500",
    },
    locationDivider: {
        height: 2,
        backgroundColor: "#E5E7EB",
        marginVertical: 8,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F9FAFB",
    },
    loadingGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 1,
    },

    // Error
    errorIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FEE2E2",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    errorIconText: {
        fontSize: 40,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#111827",
        marginBottom: 8,
    },
    errorText: {
        fontSize: 15,
        color: "#6B7280",
        marginBottom: 32,
        textAlign: "center",
        paddingHorizontal: 40,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: "900",
        color: "#FFF",
        letterSpacing: 0.5,
    },
})
