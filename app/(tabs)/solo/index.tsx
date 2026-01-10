import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
} from "react-native"
import React from "react"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import MaterialIcons from "@react-native-vector-icons/material-icons"
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from "react-native-reanimated"
import { useRuns, Run } from "@/api/runs"
import { useRunStats } from "@/api/runs"

const { width } = Dimensions.get("window")

export default function SoloTab() {
    const { data: runs, isLoading: runsLoading, error: runsError } = useRuns()
    const {
        data: stats,
        isLoading: statsLoading,
        error: statsError,
    } = useRunStats()
    const router = useRouter()

    const lastRuns = runs?.slice(0, 3) ?? []

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <Animated.ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View
                    entering={FadeInDown.delay(100)}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.titleContainer}>
                            <LinearGradient
                                colors={["#0891b2", "#16a34a"]}
                                style={styles.titleIcon}
                            >
                                <MaterialIcons
                                    name="directions-run"
                                    size={28}
                                    color="#FFF"
                                />
                            </LinearGradient>
                            <View>
                                <Text style={styles.title}>SOLO RUN</Text>
                                <Text style={styles.subtitle}>
                                    Track your personal runs
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Hero Start Card */}
                <Animated.View
                    entering={FadeInUp.delay(200)}
                    style={styles.heroCard}
                >
                    <LinearGradient
                        colors={["#0891b2", "#16a34a"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroGradient}
                    >
                        {/* Quick Stats Preview */}
                        <View style={styles.heroStatsRow}>
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>
                                    {stats?.totalRuns || 0}
                                </Text>
                                <Text style={styles.heroStatLabel}>Runs</Text>
                            </View>
                            <View style={styles.heroStatDivider} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>
                                    {stats?.totalDistance.toFixed(1) || "0.0"}
                                </Text>
                                <Text style={styles.heroStatLabel}>KM</Text>
                            </View>
                            <View style={styles.heroStatDivider} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>
                                    {stats ? Math.floor(stats.totalTime / 60) : 0}
                                </Text>
                                <Text style={styles.heroStatLabel}>Min</Text>
                            </View>
                        </View>

                        {/* Main CTA */}
                        <TouchableOpacity
                            onPress={() => router.push("/run/single/live")}
                            activeOpacity={0.9}
                            style={styles.heroButton}
                        >
                            <View style={styles.heroButtonContent}>
                                <View style={styles.heroIconCircle}>
                                    <MaterialIcons
                                        name="play-arrow"
                                        size={48}
                                        color="#0891b2"
                                    />
                                </View>
                                <View style={styles.heroTextContainer}>
                                    <Text style={styles.heroButtonText}>
                                        START NEW RUN
                                    </Text>
                                    <Text style={styles.heroButtonSubtext}>
                                        Ready to track your run?
                                    </Text>
                                </View>
                                <MaterialIcons
                                    name="arrow-forward"
                                    size={28}
                                    color="#FFF"
                                />
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>

                {/* Detailed Stats */}
                {statsLoading ? (
                    <Animated.View
                        entering={FadeInDown.delay(300)}
                        style={styles.loadingContainer}
                    >
                        <Text style={styles.loadingText}>Loading stats...</Text>
                    </Animated.View>
                ) : stats ? (
                    <Animated.View entering={FadeInDown.delay(300)}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons
                                name="analytics"
                                size={20}
                                color="#0891b2"
                            />
                            <Text style={styles.sectionTitle}>PERFORMANCE</Text>
                        </View>

                        {/* Secondary Stats */}
                        <View style={styles.secondaryStats}>
                            <View style={styles.secondaryStatCard}>
                                <View style={styles.secondaryStatIcon}>
                                    <MaterialIcons
                                        name="speed"
                                        size={20}
                                        color="#9333ea"
                                    />
                                </View>
                                <View style={styles.secondaryStatContent}>
                                    <Text style={styles.secondaryStatLabel}>
                                        Avg Pace
                                    </Text>
                                    <Text style={styles.secondaryStatValue}>
                                        {stats.averagePace || "—"}
                                    </Text>
                                </View>
                            </View>

                            {stats.longestRun && (
                                <View style={styles.secondaryStatCard}>
                                    <View style={styles.secondaryStatIcon}>
                                        <MaterialIcons
                                            name="star"
                                            size={20}
                                            color="#f59e0b"
                                        />
                                    </View>
                                    <View style={styles.secondaryStatContent}>
                                        <Text style={styles.secondaryStatLabel}>
                                            Longest Run
                                        </Text>
                                        <Text style={styles.secondaryStatValue}>
                                            {stats.longestRun.distance.toFixed(2)} km
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.secondaryStatCard}>
                                <View style={styles.secondaryStatIcon}>
                                    <MaterialIcons
                                        name="local-fire-department"
                                        size={20}
                                        color="#dc2626"
                                    />
                                </View>
                                <View style={styles.secondaryStatContent}>
                                    <Text style={styles.secondaryStatLabel}>
                                        Calories Burned
                                    </Text>
                                    <Text style={styles.secondaryStatValue}>
                                        {Math.round(stats.totalDistance * 60)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                ) : (
                    <Animated.View
                        entering={FadeInDown.delay(300)}
                        style={styles.emptyStatsContainer}
                    >
                        <MaterialIcons
                            name="analytics"
                            size={48}
                            color="#E5E7EB"
                        />
                        <Text style={styles.emptyStatsText}>No stats yet</Text>
                        <Text style={styles.emptyStatsSubtext}>
                            Start your first run!
                        </Text>
                    </Animated.View>
                )}

                {/* Recent Runs */}
                <Animated.View entering={FadeInDown.delay(400)}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons
                            name="history"
                            size={20}
                            color="#0891b2"
                        />
                        <Text style={styles.sectionTitle}>RECENT RUNS</Text>
                    </View>

                    {runsLoading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>
                                Loading runs...
                            </Text>
                        </View>
                    ) : lastRuns.length === 0 ? (
                        <View style={styles.emptyRunsContainer}>
                            <MaterialIcons
                                name="directions-run"
                                size={48}
                                color="#E5E7EB"
                            />
                            <Text style={styles.emptyRunsText}>
                                No runs yet
                            </Text>
                            <Text style={styles.emptyRunsSubtext}>
                                Hit the start button to begin
                            </Text>
                        </View>
                    ) : (
                        <>
                            {lastRuns.map((item, index) => (
                                <Animated.View
                                    key={item.id}
                                    entering={FadeInLeft.delay(500 + index * 100)}
                                >
                                    <TouchableOpacity
                                        style={styles.runItem}
                                        onPress={() =>
                                            router.push(`/run/single/${item.id}`)
                                        }
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.runIconContainer}>
                                            <LinearGradient
                                                colors={["#0891b2", "#16a34a"]}
                                                style={styles.runIcon}
                                            >
                                                <MaterialIcons
                                                    name="directions-run"
                                                    size={20}
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
                                                <View style={styles.runStatItem}>
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
                                                <View style={styles.runStatItem}>
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
                                                <View style={styles.runStatItem}>
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
                                                {new Date(item.created_at).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
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
                            ))}

                            <TouchableOpacity
                                onPress={() => router.push("/run/single/all")}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={["#E0F2FE", "#BAE6FD"]}
                                    style={styles.viewAllButton}
                                >
                                    <Text style={styles.viewAllText}>
                                        VIEW ALL RUNS
                                    </Text>
                                    <MaterialIcons
                                        name="arrow-forward"
                                        size={20}
                                        color="#0891b2"
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>
            </Animated.ScrollView>
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
    safe: { flex: 1, backgroundColor: "#F9FAFB" },
    scrollContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
    
    // Header
    header: {
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 2,
        borderBottomColor: "#E5E7EB",
        paddingHorizontal: 0,
        paddingVertical: 16,
        marginBottom: 20,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    titleContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
    titleIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: -0.5,
    },
    subtitle: { fontSize: 14, color: "#6B7280", marginTop: 2 },

    // Hero Card
    heroCard: {
        marginBottom: 24,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    heroGradient: {
        padding: 24,
    },
    heroStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    heroStat: {
        alignItems: 'center',
    },
    heroStatValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 4,
    },
    heroStatLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    heroStatDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    heroButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    heroButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    heroIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTextContainer: {
        flex: 1,
    },
    heroButtonText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    heroButtonSubtext: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },

    // Section Headers
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: -0.3,
    },

    // Secondary Stats
    secondaryStats: { gap: 10, marginBottom: 24 },
    secondaryStatCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        gap: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    secondaryStatIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryStatContent: { flex: 1 },
    secondaryStatLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#6B7280",
        marginBottom: 2,
        textTransform: "uppercase",
    },
    secondaryStatValue: { fontSize: 16, fontWeight: "900", color: "#111827" },

    // Run Items
    runItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        marginBottom: 10,
    },
    runIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: "hidden",
    },
    runIcon: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    runContent: { flex: 1 },
    runName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 6,
    },
    runStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    runStatItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    runStatText: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
    runStatDivider: { width: 1, height: 12, backgroundColor: "#D1D5DB" },
    runDate: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },

    // View All Button
    viewAllButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#0891b2",
        marginTop: 6,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: "800",
        color: "#0891b2",
        letterSpacing: 0.5,
    },

    // Empty States
    emptyStatsContainer: {
        alignItems: "center",
        paddingVertical: 40,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        marginBottom: 24,
    },
    emptyStatsText: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
        marginTop: 12,
    },
    emptyStatsSubtext: { fontSize: 14, color: "#6B7280", marginTop: 4 },
    emptyRunsContainer: {
        alignItems: "center",
        paddingVertical: 40,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    emptyRunsText: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
        marginTop: 12,
    },
    emptyRunsSubtext: { fontSize: 14, color: "#6B7280", marginTop: 4 },

    // Loading
    loadingContainer: { alignItems: "center", paddingVertical: 40 },
    loadingText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
})