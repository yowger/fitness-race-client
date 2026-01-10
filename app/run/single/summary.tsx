import React, { useState } from "react"
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Image,
    TextInput,
    Alert,
    TouchableOpacity,
} from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { Button, Surface } from "react-native-paper"
import { useReverseGeocode } from "@/api/geoapify"
import { useCreateRun } from "@/api/runs"
import { LinearGradient } from "expo-linear-gradient"
import MaterialIcons from "@react-native-vector-icons/material-icons"
import Animated, { FadeInDown } from "react-native-reanimated"

export default function RunSummary() {
    const { mutate: createRun, isPending: isCreating } = useCreateRun()

    const { summary } = useLocalSearchParams()
    const data = summary ? JSON.parse(summary as string) : null
    const [name, setName] = useState(
        `Run on ${new Date().toLocaleDateString()}`
    )
    const [isEditingName, setIsEditingName] = useState(false)

    const start = data?.route?.[0]
    const end = data?.route?.[data?.route?.length - 1]

    const { data: startAddress, isLoading: startLoading } = useReverseGeocode(
        start?.latitude,
        start?.longitude
    )
    const { data: endAddress, isLoading: endLoading } = useReverseGeocode(
        end?.latitude,
        end?.longitude
    )

    if (!data) {
        return (
            <View style={styles.center}>
                <View style={styles.errorIconContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                </View>
                <Text style={styles.errorTitle}>No Run Data</Text>
                <Text style={styles.errorText}>
                    No run data available to display
                </Text>
                <TouchableOpacity
                    style={styles.backButtonContainer}
                    onPress={() => router.back()}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={["#0891b2", "#16a34a"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.backButton}
                    >
                        <MaterialIcons
                            name="arrow-back"
                            size={24}
                            color="#FFF"
                        />
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        )
    }

    const startLabel =
        startAddress?.features?.[0]?.properties?.formatted || "Loading start..."
    const endLabel =
        endAddress?.features?.[0]?.properties?.formatted || "Loading end..."

    const handleSave = () => {
        const finalName =
            name.trim() || `Run on ${new Date().toLocaleDateString()}`

        if (!data?.route || !data?.distance || !data?.time) {
            Alert.alert("Invalid run data", "Missing run information.")
            return
        }

        createRun(
            {
                name: finalName,
                distance: data.distance,
                time: data.time,
                pace: data.pace,
                route: data.route,
                map_image: data.map_image,
                route_id: data.route_id,
                start_address: startLabel,
                end_address: endLabel,
            },
            {
                onSuccess: () => {
                    Alert.alert(
                        "Run Saved",
                        "Your run has been saved successfully."
                    )
                    router.replace("/(tabs)/races")
                },
                onError: (err: any) => {
                    console.error("❌ createRun error:", err)
                    Alert.alert(
                        "Error saving run",
                        err?.message || "Something went wrong"
                    )
                },
            }
        )
    }

    const handleDiscard = () => {
        Alert.alert(
            "Discard Run?",
            "This run will be deleted and cannot be recovered.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Discard",
                    style: "destructive",
                    onPress: () => router.push("/run/single/live"),
                },
            ]
        )
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* Hero Section with Map */}
            <Animated.View
                entering={FadeInDown.delay(100)}
                style={styles.heroSection}
            >
                {data.mapImage ? (
                    <View style={styles.mapContainer}>
                        <Image
                            source={{ uri: data.mapImage }}
                            style={styles.mapImage}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.8)"]}
                            style={styles.mapGradient}
                        />
                    </View>
                ) : (
                    <LinearGradient
                        colors={["#0891b2", "#16a34a"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.mapPlaceholder}
                    >
                        <MaterialIcons
                            name="directions-run"
                            size={80}
                            color="rgba(255,255,255,0.3)"
                        />
                    </LinearGradient>
                )}

                {/* Completion Badge */}
                <View style={styles.completionBadgeContainer}>
                    <LinearGradient
                        colors={["#16a34a", "#15803d"]}
                        style={styles.completionBadge}
                    >
                        <MaterialIcons
                            name="check-circle"
                            size={20}
                            color="#FFF"
                        />
                        <Text style={styles.completionBadgeText}>
                            COMPLETED
                        </Text>
                    </LinearGradient>
                </View>

                {/* Title overlay */}
                <View style={styles.titleOverlay}>
                    {isEditingName ? (
                        <View style={styles.nameInputContainer}>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                onBlur={() => setIsEditingName(false)}
                                placeholder="Enter run name"
                                placeholderTextColor="#9CA3AF"
                                style={styles.nameInput}
                                autoFocus
                            />
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setIsEditingName(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.runTitle}>{name}</Text>
                            <View style={styles.editHintContainer}>
                                <MaterialIcons
                                    name="edit"
                                    size={14}
                                    color="rgba(255,255,255,0.7)"
                                />
                                <Text style={styles.editHint}>Tap to edit</Text>
                            </View>
                        </TouchableOpacity>
                    )}
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
                    <View style={styles.statIconContainer}>
                        <MaterialIcons
                            name="straighten"
                            size={24}
                            color="#0891b2"
                        />
                    </View>
                    <Text style={styles.statValue}>
                        {data.distance?.toFixed(2)}
                    </Text>
                    <Text style={styles.statUnit}>km</Text>
                    <Text style={styles.statLabel}>DISTANCE</Text>
                </LinearGradient>

                <LinearGradient
                    colors={["#DCFCE7", "#BBF7D0"]}
                    style={styles.statCard}
                >
                    <View style={styles.statIconContainer}>
                        <MaterialIcons
                            name="schedule"
                            size={24}
                            color="#16a34a"
                        />
                    </View>
                    <Text style={styles.statValue}>
                        {data.time ? formatTime(data.time) : "0:00"}
                    </Text>
                    <Text style={styles.statUnit}>time</Text>
                    <Text style={styles.statLabel}>DURATION</Text>
                </LinearGradient>

                <LinearGradient
                    colors={["#FEF3C7", "#FDE68A"]}
                    style={styles.statCard}
                >
                    <View style={styles.statIconContainer}>
                        <MaterialIcons name="speed" size={24} color="#d97706" />
                    </View>
                    <Text style={styles.statValue}>{data.pace}</Text>
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
                            {Math.round((data.distance || 0) * 60)}
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
                            {data.route?.length || 0}
                        </Text>
                        <Text style={styles.additionalStatLabel}>
                            GPS Points
                        </Text>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Route Details Card */}
            <Animated.View
                entering={FadeInDown.delay(400)}
                style={styles.routeCardContainer}
            >
                <View style={styles.routeCard}>
                    <View style={styles.routeHeader}>
                        <View style={styles.routeHeaderLeft}>
                            <View style={styles.routeIconBadge}>
                                <MaterialIcons
                                    name="map"
                                    size={20}
                                    color="#0891b2"
                                />
                            </View>
                            <Text style={styles.sectionTitle}>
                                Route Details
                            </Text>
                        </View>
                    </View>

                    <View style={styles.routeTimeline}>
                        {/* Start Point */}
                        <View style={styles.timelineItem}>
                            <View style={styles.timelineMarker}>
                                <View style={styles.startMarker}>
                                    <MaterialIcons
                                        name="play-arrow"
                                        size={12}
                                        color="#FFF"
                                    />
                                </View>
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineLabel}>
                                    START POINT
                                </Text>
                                <Text style={styles.timelineAddress}>
                                    {startLoading ? "Loading..." : startLabel}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.timelineLine} />

                        {/* Finish Point */}
                        <View style={styles.timelineItem}>
                            <View style={styles.timelineMarker}>
                                <View style={styles.endMarker}>
                                    <MaterialIcons
                                        name="flag"
                                        size={12}
                                        color="#FFF"
                                    />
                                </View>
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineLabel}>
                                    FINISH POINT
                                </Text>
                                <Text style={styles.timelineAddress}>
                                    {endLoading ? "Loading..." : endLabel}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View
                entering={FadeInDown.delay(500)}
                style={styles.actionSection}
            >
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isCreating}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={["#0891b2", "#16a34a"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButton}
                    >
                        <MaterialIcons
                            name={isCreating ? "hourglass-empty" : "save"}
                            size={24}
                            color="#FFF"
                        />
                        <Text style={styles.saveButtonText}>
                            {isCreating ? "SAVING..." : "SAVE RUN"}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleDiscard} activeOpacity={0.9}>
                    <View style={styles.discardButton}>
                        <MaterialIcons
                            name="delete-outline"
                            size={24}
                            color="#dc2626"
                        />
                        <Text style={styles.discardButtonText}>
                            DISCARD RUN
                        </Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>

            <View style={{ height: 40 }} />
        </ScrollView>
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
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    contentContainer: {
        paddingBottom: 20,
    },

    // Hero Section
    heroSection: {
        position: "relative",
        height: 280,
        marginBottom: 20,
    },
    mapContainer: {
        width: "100%",
        height: "100%",
        position: "relative",
    },
    mapImage: {
        width: "100%",
        height: "100%",
    },
    mapPlaceholder: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    mapGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    completionBadgeContainer: {
        position: "absolute",
        top: 20,
        right: 20,
    },
    completionBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    completionBadgeText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#FFF",
        letterSpacing: 0.5,
    },
    titleOverlay: {
        position: "absolute",
        bottom: 24,
        left: 20,
        right: 20,
    },
    runTitle: {
        color: "#FFF",
        fontSize: 32,
        fontWeight: "900",
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    editHintContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    editHint: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
        fontWeight: "600",
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    nameInputContainer: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#0891b2",
    },
    nameInput: {
        color: "#111827",
        padding: 16,
        fontSize: 24,
        fontWeight: "800",
    },

    // Stats Grid
    statsGrid: {
        flexDirection: "row",
        paddingHorizontal: 20,
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
    statIconContainer: {
        marginBottom: 8,
    },
    statValue: {
        color: "#111827",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 28,
        letterSpacing: -0.5,
    },
    statUnit: {
        color: "#6B7280",
        fontSize: 10,
        marginTop: 2,
        marginBottom: 6,
        fontWeight: "600",
    },
    statLabel: {
        color: "#6B7280",
        fontSize: 9,
        fontWeight: "800",
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
        fontSize: 20,
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

    // Route Card
    routeCardContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    routeCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    routeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    routeHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    routeIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#E0F2FE",
        alignItems: "center",
        justifyContent: "center",
    },
    sectionTitle: {
        color: "#111827",
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: -0.3,
    },

    // Timeline
    routeTimeline: {
        position: "relative",
    },
    timelineItem: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    timelineMarker: {
        width: 40,
        alignItems: "center",
        paddingTop: 4,
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
    timelineLine: {
        position: "absolute",
        left: 19,
        top: 32,
        bottom: 32,
        width: 2,
        backgroundColor: "#E5E7EB",
    },
    timelineContent: {
        flex: 1,
        marginLeft: 12,
        paddingBottom: 28,
    },
    timelineLabel: {
        color: "#6B7280",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    timelineAddress: {
        color: "#111827",
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "500",
    },

    // Action Section
    actionSection: {
        paddingHorizontal: 20,
        gap: 12,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 18,
        borderRadius: 12,
    },
    saveButtonText: {
        color: "#FFF",
        fontSize: 17,
        fontWeight: "900",
        letterSpacing: 0.5,
    },
    discardButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "transparent",
        borderRadius: 12,
        paddingVertical: 18,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    discardButtonText: {
        color: "#dc2626",
        fontSize: 17,
        fontWeight: "800",
        letterSpacing: 0.5,
    },

    // Error State
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F9FAFB",
        padding: 20,
    },
    errorIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FEE2E2",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    errorIcon: {
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
    },
    backButtonContainer: {
        borderRadius: 12,
        overflow: "hidden",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: 0.5,
    },
})
