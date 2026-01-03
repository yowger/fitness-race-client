import {
    StyleSheet,
    View,
    ScrollView,
    Image,
    Pressable,
    useWindowDimensions,
} from "react-native"
import React, { useEffect, useRef, useState } from "react"
import {
    Text,
    Button,
    Chip,
    Avatar,
    Divider,
    useTheme,
} from "react-native-paper"
import { useLocalSearchParams } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated"

import { useRace, useRaceEvents, useJoinRace, useLeaveRace } from "@/api/races"
import { useAuth } from "@/providers/AuthProvider"
import RenderHtml from "react-native-render-html"

import {
    MapView,
    Camera,
    ShapeSource,
    LineLayer,
    PointAnnotation,
    MapViewRef,
    CameraRef,
} from "@maplibre/maplibre-react-native"
import { MAP_STYLE_URL } from "@/config/map"

const { width } = useWindowDimensions()

const Details = () => {
    const theme = useTheme()
    const { id } = useLocalSearchParams<{ id: string }>()
    const { session } = useAuth()

    const userId = session?.user?.id

    const { data: race } = useRace(id!)
    const { data: events = [] } = useRaceEvents(id)

    const joinRace = useJoinRace()
    const leaveRace = useLeaveRace()

    const [activeTab, setActiveTab] = useState<
        "details" | "route" | "schedule"
    >("details")

    if (!race) return null

    const isRegistered = race.participants?.some((p) => p.user_id === userId)

    const getStatusConfig = () => {
        switch (race.status) {
            case "upcoming":
                return {
                    color: "#0891b2",
                    bgColor: "#E0F2FE",
                    label: "UPCOMING",
                    borderColor: "#7DD3FC",
                }
            case "ongoing":
                return {
                    color: "#16a34a",
                    bgColor: "#DCFCE7",
                    label: "LIVE",
                    borderColor: "#86EFAC",
                }
            case "finished":
            case "complete":
                return {
                    color: "#6B7280",
                    bgColor: "#F3F4F6",
                    label: "FINISHED",
                    borderColor: "#D1D5DB",
                }
            default:
                return {
                    color: "#6B7280",
                    bgColor: "#F3F4F6",
                    label: "UNKNOWN",
                    borderColor: "#D1D5DB",
                }
        }
    }

    const statusConfig = getStatusConfig()

    const routeCoords =
        race.routes?.geojson?.features?.[0]?.geometry?.coordinates

    const participantPercentage = race.max_participants
        ? ((race.participants?.length ?? 0) / race.max_participants) * 100
        : 0

    const isJoining = joinRace.isPending
    const isLeaving = leaveRace.isPending
    const isMutating = isJoining || isLeaving

    const canJoin =
        !!userId && race.status === "upcoming" && !isRegistered && !isMutating

    const canLeave =
        !!userId && race.status === "upcoming" && isRegistered && !isMutating

    const handleJoinLeave = () => {
        console.log("handleJoinLeave")

        if (!userId) return

        if (isRegistered) {
            leaveRace.mutate({
                race_id: race.id,
                user_id: userId,
            })
        } else {
            joinRace.mutate({
                race_id: race.id,
                user_id: userId,
            })
        }
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    {race.banner_url ? (
                        <Image
                            source={{ uri: race.banner_url }}
                            style={styles.heroImage}
                        />
                    ) : (
                        <LinearGradient
                            colors={["#0891b2", "#16a34a"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroImage}
                        />
                    )}

                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.7)"]}
                        style={styles.heroOverlay}
                    />

                    {/* Status Badge */}
                    <View style={styles.statusBadgeContainer}>
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor: statusConfig.bgColor,
                                    borderColor: statusConfig.borderColor,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: statusConfig.color },
                                ]}
                            >
                                {statusConfig.label}
                            </Text>
                        </View>
                    </View>

                    {/* Distance Badge */}
                    {race.routes?.distance && (
                        <View style={styles.distanceBadgeContainer}>
                            <View style={styles.distanceBadge}>
                                <Text style={styles.distanceBadgeText}>
                                    🏁 {race.routes.distance.toFixed(1)} KM
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Title Overlay */}
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle} numberOfLines={2}>
                            {race.name}
                        </Text>
                        <View style={styles.heroInfo}>
                            <Text style={styles.heroInfoText}>
                                📅{" "}
                                {new Date(race.start_time).toLocaleDateString(
                                    "en-US",
                                    {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    }
                                )}
                            </Text>
                            <Text style={styles.heroInfoText}>
                                ⏰{" "}
                                {new Date(race.start_time).toLocaleTimeString(
                                    "en-US",
                                    { hour: "2-digit", minute: "2-digit" }
                                )}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Stats Cards */}
                    <Animated.View
                        entering={FadeInUp.delay(100)}
                        style={styles.statsContainer}
                    >
                        <LinearGradient
                            colors={["#E0F2FE", "#BAE6FD"]}
                            style={styles.statCard}
                        >
                            <Text style={styles.statValue}>
                                {race.routes?.distance?.toFixed(1) ?? "—"}
                            </Text>
                            <Text style={styles.statLabel}>KM</Text>
                            <Text style={styles.statSubLabel}>Distance</Text>
                        </LinearGradient>

                        <LinearGradient
                            colors={["#DCFCE7", "#BBF7D0"]}
                            style={styles.statCard}
                        >
                            <Text style={styles.statValue}>
                                {race.participants?.length ?? 0}
                            </Text>
                            <Text style={styles.statLabel}>RUNNERS</Text>
                            <Text style={styles.statSubLabel}>Registered</Text>
                        </LinearGradient>

                        <LinearGradient
                            colors={["#FEF3C7", "#FDE68A"]}
                            style={styles.statCard}
                        >
                            <Text style={styles.statValue}>
                                {race.price ? `₱${race.price}` : "FREE"}
                            </Text>
                            <Text style={styles.statLabel}>ENTRY</Text>
                            <Text style={styles.statSubLabel}>Fee</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Participants Progress */}
                    {race.max_participants && (
                        <Animated.View
                            entering={FadeInUp.delay(200)}
                            style={styles.progressContainer}
                        >
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>
                                    👥 Registration Progress
                                </Text>
                                <Text style={styles.progressPercentage}>
                                    {Math.round(participantPercentage)}%
                                </Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBarBg}>
                                    <LinearGradient
                                        colors={["#0891b2", "#16a34a"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: `${participantPercentage}%`,
                                            },
                                        ]}
                                    />
                                </View>
                            </View>
                            <Text style={styles.progressText}>
                                {race.participants?.length ?? 0} /{" "}
                                {race.max_participants} spots filled
                            </Text>
                        </Animated.View>
                    )}

                    {/* Organizer Card */}
                    <Animated.View
                        entering={FadeInUp.delay(300)}
                        style={styles.organizerCard}
                    >
                        <View style={styles.organizerHeader}>
                            <Text style={styles.organizerTitle}>
                                ORGANIZED BY
                            </Text>
                        </View>
                        <View style={styles.organizerContent}>
                            <LinearGradient
                                colors={["#0891b2", "#16a34a"]}
                                style={styles.avatarGradient}
                            >
                                {race.created_by_user.avatar_url ? (
                                    <Avatar.Image
                                        size={56}
                                        source={{
                                            uri: race.created_by_user
                                                .avatar_url,
                                        }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {race.created_by_user.full_name?.[0] ??
                                            "U"}
                                    </Text>
                                )}
                            </LinearGradient>
                            <View style={styles.organizerInfo}>
                                <Text style={styles.organizerName}>
                                    {race.created_by_user.full_name}
                                </Text>
                                <Text style={styles.organizerEmail}>
                                    {race.created_by_user.email}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Tabs */}
                    <Animated.View
                        entering={FadeInUp.delay(400)}
                        style={styles.tabContainer}
                    >
                        {(["details", "route", "schedule"] as const).map(
                            (tab) => (
                                <Pressable
                                    key={tab}
                                    style={[
                                        styles.tab,
                                        activeTab === tab &&
                                            styles.activeTabStyle,
                                    ]}
                                    onPress={() => setActiveTab(tab)}
                                >
                                    {activeTab === tab && (
                                        <LinearGradient
                                            colors={["#0891b2", "#16a34a"]}
                                            style={StyleSheet.absoluteFill}
                                        />
                                    )}
                                    <Text
                                        style={[
                                            styles.tabText,
                                            activeTab === tab &&
                                                styles.activeTabText,
                                        ]}
                                    >
                                        {tab.toUpperCase()}
                                    </Text>
                                </Pressable>
                            )
                        )}
                    </Animated.View>

                    {/* Tab Content */}
                    <Animated.View entering={FadeInDown.delay(500)}>
                        {/* DETAILS */}
                        {activeTab === "details" && (
                            <View style={styles.tabContentContainer}>
                                <View style={styles.tabContentContainer}>
                                    <View style={styles.sectionCard}>
                                        <Text style={styles.sectionTitle}>
                                            📋 About This Race
                                        </Text>

                                        {race.description ? (
                                            <RenderHtml
                                                contentWidth={width}
                                                source={{
                                                    html: race.description,
                                                }}
                                                tagsStyles={{
                                                    p: {
                                                        marginBottom: 8,
                                                        lineHeight: 20,
                                                        color: "#4B5563",
                                                    },
                                                    h1: {
                                                        fontSize: 24,
                                                        fontWeight: "700",
                                                        marginBottom: 12,
                                                    },
                                                    h2: {
                                                        fontSize: 20,
                                                        fontWeight: "600",
                                                        marginBottom: 10,
                                                    },
                                                    strong: {
                                                        fontWeight: "700",
                                                    },
                                                }}
                                            />
                                        ) : (
                                            <Text style={styles.description}>
                                                No description provided.
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {race.routes?.start_address && (
                                    <View style={styles.sectionCard}>
                                        <Text style={styles.sectionTitle}>
                                            📍 Starting Point
                                        </Text>
                                        <Text style={styles.locationText}>
                                            {race.routes.start_address}
                                        </Text>
                                    </View>
                                )}

                                {race.routes?.end_address && (
                                    <View style={styles.sectionCard}>
                                        <Text style={styles.sectionTitle}>
                                            🏁 Finish Line
                                        </Text>
                                        <Text style={styles.locationText}>
                                            {race.routes.end_address}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* ROUTE */}
                        {activeTab === "route" && routeCoords && (
                            <View style={styles.tabContentContainer}>
                                <View style={styles.mapCard}>
                                    <Text style={styles.sectionTitle}>
                                        🗺️ Race Route
                                    </Text>
                                    <View style={styles.mapContainer}>
                                        <MapView
                                            style={StyleSheet.absoluteFill}
                                            attributionEnabled={false}
                                            mapStyle={MAP_STYLE_URL}
                                        >
                                            {/* <Camera
                                                ref={cameraRef}
                                                animationMode="flyTo"
                                                animationDuration={800}
                                            /> */}
                                            {/* Route line */}
                                            <ShapeSource
                                                id="route"
                                                shape={{
                                                    type: "Feature",
                                                    geometry: {
                                                        type: "LineString",
                                                        coordinates:
                                                            routeCoords,
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

                                            {/* Start */}
                                            <PointAnnotation
                                                id="start"
                                                coordinate={routeCoords[0]}
                                            >
                                                <View
                                                    style={styles.startMarker}
                                                />
                                            </PointAnnotation>

                                            {/* Finish */}
                                            <PointAnnotation
                                                id="finish"
                                                coordinate={
                                                    routeCoords[
                                                        routeCoords.length - 1
                                                    ]
                                                }
                                            >
                                                <View
                                                    style={styles.finishMarker}
                                                />
                                            </PointAnnotation>
                                        </MapView>
                                    </View>

                                    {/* Map Legend */}
                                    <View style={styles.mapLegend}>
                                        <View style={styles.legendItem}>
                                            <View
                                                style={styles.startMarkerLegend}
                                            />
                                            <Text style={styles.legendText}>
                                                Start
                                            </Text>
                                        </View>
                                        <View style={styles.legendItem}>
                                            <View
                                                style={styles.routeLineLegend}
                                            />
                                            <Text style={styles.legendText}>
                                                Route
                                            </Text>
                                        </View>
                                        <View style={styles.legendItem}>
                                            <View
                                                style={
                                                    styles.finishMarkerLegend
                                                }
                                            />
                                            <Text style={styles.legendText}>
                                                Finish
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* SCHEDULE */}
                        {activeTab === "schedule" && (
                            <View style={styles.tabContentContainer}>
                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionTitle}>
                                        ⏱️ Event Schedule
                                    </Text>
                                    {events.length > 0 ? (
                                        events.map((e, idx) => (
                                            <View
                                                key={e.id}
                                                style={styles.scheduleItem}
                                            >
                                                <View
                                                    style={
                                                        styles.scheduleTimeContainer
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.scheduleTime
                                                        }
                                                    >
                                                        {new Date(
                                                            e.scheduled_time
                                                        ).toLocaleTimeString(
                                                            "en-US",
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </Text>
                                                </View>
                                                <View
                                                    style={styles.scheduleDot}
                                                />
                                                <View
                                                    style={
                                                        styles.scheduleEventContainer
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.scheduleEvent
                                                        }
                                                    >
                                                        {e.name}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyText}>
                                            No schedule available yet
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}
                    </Animated.View>

                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <Pressable
                    disabled={!canJoin && !canLeave}
                    style={[
                        styles.registerButton,
                        isMutating && { opacity: 0.7 },
                    ]}
                    onPress={handleJoinLeave}
                >
                    <LinearGradient
                        colors={
                            isRegistered
                                ? ["#E5E7EB", "#D1D5DB"]
                                : ["#0891b2", "#16a34a"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.registerButtonGradient}
                    >
                        <Text
                            style={[
                                styles.registerButtonText,
                                isRegistered && styles.registeredButtonText,
                            ]}
                        >
                            {isMutating
                                ? "PLEASE WAIT..."
                                : isRegistered
                                ? "REGISTERED"
                                : "JOIN RACE"}
                        </Text>
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    )
}

export default Details

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    heroContainer: {
        position: "relative",
        width: "100%",
        height: 340,
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    heroOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    statusBadgeContainer: {
        position: "absolute",
        top: 16,
        right: 16,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 2,
    },
    statusText: {
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: 1,
    },
    distanceBadgeContainer: {
        position: "absolute",
        bottom: 16,
        right: 16,
    },
    distanceBadge: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    distanceBadgeText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "700",
    },
    heroTextContainer: {
        position: "absolute",
        bottom: 24,
        left: 20,
        right: 20,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: "900",
        color: "#FFFFFF",
        marginBottom: 8,
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: -0.5,
    },
    heroInfo: {
        flexDirection: "row",
        gap: 16,
    },
    heroInfoText: {
        fontSize: 14,
        color: "#FFFFFF",
        fontWeight: "600",
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    content: {
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    statsContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
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
        fontSize: 24,
        fontWeight: "900",
        color: "#111827",
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 1,
    },
    statSubLabel: {
        fontSize: 10,
        color: "#9CA3AF",
        marginTop: 2,
    },
    progressContainer: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
    },
    progressPercentage: {
        fontSize: 18,
        fontWeight: "900",
        color: "#0891b2",
    },
    progressBarContainer: {
        marginBottom: 8,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: "#6B7280",
        textAlign: "center",
    },
    organizerCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        marginBottom: 20,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    organizerHeader: {
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: "#E5E7EB",
    },
    organizerTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 1,
    },
    organizerContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 16,
    },
    avatarGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    avatar: {
        backgroundColor: "transparent",
    },
    avatarText: {
        fontSize: 24,
        fontWeight: "900",
        color: "#FFFFFF",
    },
    organizerInfo: {
        flex: 1,
    },
    organizerName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    organizerEmail: {
        fontSize: 13,
        color: "#6B7280",
    },
    tabContainer: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        backgroundColor: "#E5E7EB",
        borderWidth: 2,
        borderColor: "#D1D5DB",
        overflow: "hidden",
    },
    activeTabStyle: {
        borderColor: "#0891b2",
    },
    tabText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 1,
    },
    activeTabText: {
        color: "#FFFFFF",
    },
    tabContentContainer: {
        gap: 16,
    },
    sectionCard: {
        backgroundColor: "#FFFFFF",
        padding: 20,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 15,
        color: "#4B5563",
        lineHeight: 24,
    },
    locationText: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 22,
    },
    mapCard: {
        backgroundColor: "#FFFFFF",
        padding: 20,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    mapContainer: {
        height: 300,
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#D1D5DB",
    },
    startMarker: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#16a34a",
        borderWidth: 3,
        borderColor: "#fff",
    },
    finishMarker: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#dc2626",
        borderWidth: 3,
        borderColor: "#fff",
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
    scheduleItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 16,
        gap: 12,
    },
    scheduleTimeContainer: {
        width: 80,
        alignItems: "flex-end",
    },
    scheduleTime: {
        fontSize: 14,
        fontWeight: "800",
        color: "#0891b2",
    },
    scheduleDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#16a34a",
        marginTop: 4,
    },
    scheduleEventContainer: {
        flex: 1,
    },
    scheduleEvent: {
        fontSize: 14,
        color: "#4B5563",
        lineHeight: 20,
        fontWeight: "500",
    },
    emptyText: {
        fontSize: 14,
        color: "#9CA3AF",
        textAlign: "center",
        fontStyle: "italic",
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
        borderTopWidth: 2,
        borderTopColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 12,
    },
    registerButton: {
        borderRadius: 12,
        overflow: "hidden",
    },
    registerButtonGradient: {
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    registerButtonText: {
        fontSize: 17,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 1,
    },
    registeredButtonText: {
        color: "#6B7280",
    },
})
