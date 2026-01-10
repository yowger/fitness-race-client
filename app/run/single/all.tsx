import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native"
import React, { useState } from "react"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import MaterialIcons from "@react-native-vector-icons/material-icons"
import Animated, { FadeInDown } from "react-native-reanimated"
import { useRuns, Run } from "@/api/runs"
import { useRunStats } from "@/api/runs"

export default function AllRuns() {
    const router = useRouter()
    const { data: runs, isLoading: runsLoading, error: runsError } = useRuns()
    const { data: stats, isLoading: statsLoading } = useRunStats()

    const [sortBy, setSortBy] = useState<"date" | "distance" | "time">("date")

    // Sort runs
    const sortedRuns = React.useMemo(() => {
        if (!runs) return []

        return [...runs].sort((a, b) => {
            switch (sortBy) {
                case "distance":
                    return b.distance - a.distance
                case "time":
                    return b.time - a.time
                case "date":
                default:
                    return (
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
            }
        })
    }, [runs, sortBy])

    if (runsLoading || statsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={["#0891b2", "#16a34a"]}
                    style={styles.loadingGradient}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.loadingText}>LOADING RUNS...</Text>
            </View>
        )
    }

    if (runsError) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.errorIcon}>
                    <Text style={styles.errorIconText}>⚠️</Text>
                </View>
                <Text style={styles.errorTitle}>Failed to Load</Text>
                <Text style={styles.errorText}>
                    {runsError.message || "Something went wrong"}
                </Text>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.container}>
                {/* Header */}
                <Animated.View
                    entering={FadeInDown.delay(100)}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <MaterialIcons
                                name="arrow-back"
                                size={24}
                                color="#111827"
                            />
                        </TouchableOpacity>
                        <View style={styles.titleContainer}>
                            <LinearGradient
                                colors={["#0891b2", "#16a34a"]}
                                style={styles.titleIcon}
                            >
                                <MaterialIcons
                                    name="list"
                                    size={24}
                                    color="#FFF"
                                />
                            </LinearGradient>
                            <View>
                                <Text style={styles.title}>ALL RUNS</Text>
                                <Text style={styles.subtitle}>
                                    {runs?.length || 0} runs recorded
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Stats Overview */}
                {stats && (
                    <Animated.View
                        entering={FadeInDown.delay(200)}
                        style={styles.statsSection}
                    >
                        <View style={styles.statsGrid}>
                            <LinearGradient
                                colors={["#E0F2FE", "#BAE6FD"]}
                                style={styles.statCard}
                            >
                                <MaterialIcons
                                    name="flag"
                                    size={20}
                                    color="#0891b2"
                                />
                                <Text style={styles.statValue}>
                                    {stats.totalRuns}
                                </Text>
                                <Text style={styles.statLabel}>RUNS</Text>
                            </LinearGradient>

                            <LinearGradient
                                colors={["#DCFCE7", "#BBF7D0"]}
                                style={styles.statCard}
                            >
                                <MaterialIcons
                                    name="straighten"
                                    size={20}
                                    color="#16a34a"
                                />
                                <Text style={styles.statValue}>
                                    {stats.totalDistance.toFixed(1)}
                                </Text>
                                <Text style={styles.statLabel}>KM</Text>
                            </LinearGradient>

                            <LinearGradient
                                colors={["#FEF3C7", "#FDE68A"]}
                                style={styles.statCard}
                            >
                                <MaterialIcons
                                    name="schedule"
                                    size={20}
                                    color="#d97706"
                                />
                                <Text style={styles.statValue}>
                                    {Math.floor(stats.totalTime / 60)}
                                </Text>
                                <Text style={styles.statLabel}>MIN</Text>
                            </LinearGradient>

                            <LinearGradient
                                colors={["#F3E8FF", "#E9D5FF"]}
                                style={styles.statCard}
                            >
                                <MaterialIcons
                                    name="speed"
                                    size={20}
                                    color="#9333ea"
                                />
                                <Text style={styles.statValue}>
                                    {stats.averagePace || "—"}
                                </Text>
                                <Text style={styles.statLabel}>PACE</Text>
                            </LinearGradient>
                        </View>

                        {stats.longestRun && (
                            <View style={styles.highlightCard}>
                                <View style={styles.highlightIcon}>
                                    <MaterialIcons
                                        name="star"
                                        size={24}
                                        color="#f59e0b"
                                    />
                                </View>
                                <View style={styles.highlightContent}>
                                    <Text style={styles.highlightLabel}>
                                        LONGEST RUN
                                    </Text>
                                    <Text style={styles.highlightValue}>
                                        {stats.longestRun.distance.toFixed(2)}{" "}
                                        km
                                    </Text>
                                    <Text
                                        style={styles.highlightName}
                                        numberOfLines={1}
                                    >
                                        {stats.longestRun.name}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Sort Options */}
                <Animated.View
                    entering={FadeInDown.delay(300)}
                    style={styles.sortSection}
                >
                    <Text style={styles.sortLabel}>SORT BY</Text>
                    <View style={styles.sortButtons}>
                        <TouchableOpacity
                            onPress={() => setSortBy("date")}
                            activeOpacity={0.8}
                        >
                            {sortBy === "date" ? (
                                <LinearGradient
                                    colors={["#0891b2", "#16a34a"]}
                                    style={styles.sortButtonActive}
                                >
                                    <MaterialIcons
                                        name="schedule"
                                        size={16}
                                        color="#FFF"
                                    />
                                    <Text style={styles.sortTextActive}>
                                        DATE
                                    </Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.sortButtonInactive}>
                                    <MaterialIcons
                                        name="schedule"
                                        size={16}
                                        color="#6B7280"
                                    />
                                    <Text style={styles.sortTextInactive}>
                                        DATE
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setSortBy("distance")}
                            activeOpacity={0.8}
                        >
                            {sortBy === "distance" ? (
                                <LinearGradient
                                    colors={["#0891b2", "#16a34a"]}
                                    style={styles.sortButtonActive}
                                >
                                    <MaterialIcons
                                        name="straighten"
                                        size={16}
                                        color="#FFF"
                                    />
                                    <Text style={styles.sortTextActive}>
                                        DISTANCE
                                    </Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.sortButtonInactive}>
                                    <MaterialIcons
                                        name="straighten"
                                        size={16}
                                        color="#6B7280"
                                    />
                                    <Text style={styles.sortTextInactive}>
                                        DISTANCE
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setSortBy("time")}
                            activeOpacity={0.8}
                        >
                            {sortBy === "time" ? (
                                <LinearGradient
                                    colors={["#0891b2", "#16a34a"]}
                                    style={styles.sortButtonActive}
                                >
                                    <MaterialIcons
                                        name="timer"
                                        size={16}
                                        color="#FFF"
                                    />
                                    <Text style={styles.sortTextActive}>
                                        TIME
                                    </Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.sortButtonInactive}>
                                    <MaterialIcons
                                        name="timer"
                                        size={16}
                                        color="#6B7280"
                                    />
                                    <Text style={styles.sortTextInactive}>
                                        TIME
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Runs List */}
                <FlatList
                    data={sortedRuns}
                    keyExtractor={(item: Run) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item, index }) => (
                        <Animated.View
                            entering={FadeInDown.delay(400 + index * 50)}
                        >
                            <TouchableOpacity
                                style={styles.runItem}
                                onPress={() => {
                                    router.push({
                                        pathname: "/run/single/[id]",
                                        params: { id: item.id },
                                    })
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.runIconContainer}>
                                    <LinearGradient
                                        colors={["#0891b2", "#16a34a"]}
                                        style={styles.runIcon}
                                    >
                                        <MaterialIcons
                                            name="directions-run"
                                            size={24}
                                            color="#FFF"
                                        />
                                    </LinearGradient>
                                </View>

                                <View style={styles.runContent}>
                                    <Text
                                        style={styles.runName}
                                        numberOfLines={1}
                                    >
                                        {item.name}
                                    </Text>

                                    <View style={styles.runStats}>
                                        <View style={styles.runStat}>
                                            <MaterialIcons
                                                name="straighten"
                                                size={14}
                                                color="#6B7280"
                                            />
                                            <Text style={styles.runStatText}>
                                                {item.distance.toFixed(2)} km
                                            </Text>
                                        </View>
                                        <View style={styles.runStatDivider} />
                                        <View style={styles.runStat}>
                                            <MaterialIcons
                                                name="schedule"
                                                size={14}
                                                color="#6B7280"
                                            />
                                            <Text style={styles.runStatText}>
                                                {formatTime(item.time)}
                                            </Text>
                                        </View>
                                        <View style={styles.runStatDivider} />
                                        <View style={styles.runStat}>
                                            <MaterialIcons
                                                name="speed"
                                                size={14}
                                                color="#6B7280"
                                            />
                                            <Text style={styles.runStatText}>
                                                {item.pace}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.runDate}>
                                        {new Date(
                                            item.created_at
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </Text>
                                </View>

                                <MaterialIcons
                                    name="chevron-right"
                                    size={24}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons
                                name="directions-run"
                                size={64}
                                color="#E5E7EB"
                            />
                            <Text style={styles.emptyTitle}>No Runs Yet</Text>
                            <Text style={styles.emptyText}>
                                Start tracking your runs to see them here
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    )
}

function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
        return `${hours}h ${mins}m`
    }
    return `${mins}m ${secs}s`
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    container: {
        flex: 1,
    },

    // Header
    header: {
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 2,
        borderBottomColor: "#E5E7EB",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    titleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 2,
    },

    // Stats Section
    statsSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 2,
        borderBottomColor: "#E5E7EB",
    },
    statsGrid: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 10,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "rgba(0, 0, 0, 0.05)",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "900",
        color: "#111827",
        marginTop: 6,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 8,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 0.5,
    },

    // Highlight Card
    highlightCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF3C7",
        padding: 14,
        borderRadius: 12,
        gap: 12,
        borderWidth: 2,
        borderColor: "#FDE68A",
    },
    highlightIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FFF",
        alignItems: "center",
        justifyContent: "center",
    },
    highlightContent: {
        flex: 1,
    },
    highlightLabel: {
        fontSize: 9,
        fontWeight: "800",
        color: "#78350f",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    highlightValue: {
        fontSize: 20,
        fontWeight: "900",
        color: "#111827",
        marginBottom: 2,
    },
    highlightName: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },

    // Sort Section
    sortSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 2,
        borderBottomColor: "#E5E7EB",
    },
    sortLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    sortButtons: {
        flexDirection: "row",
        gap: 8,
    },
    sortButtonActive: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    sortButtonInactive: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    sortTextActive: {
        fontSize: 12,
        fontWeight: "800",
        color: "#FFF",
        letterSpacing: 0.5,
    },
    sortTextInactive: {
        fontSize: 12,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 0.5,
    },

    // List
    listContent: {
        padding: 20,
        paddingBottom: 40,
        gap: 12,
    },
    runItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    runIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: "hidden",
    },
    runIcon: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    runContent: {
        flex: 1,
    },
    runName: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 6,
        letterSpacing: -0.2,
    },
    runStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    runStat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    runStatText: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },
    runStatDivider: {
        width: 1,
        height: 12,
        backgroundColor: "#D1D5DB",
    },
    runDate: {
        fontSize: 11,
        color: "#9CA3AF",
        fontWeight: "500",
    },

    // Empty State
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: "#111827",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
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
        textAlign: "center",
        paddingHorizontal: 40,
    },
})
