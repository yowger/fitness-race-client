import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from "react-native"
import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated"
import { useAuth } from "@/providers/AuthProvider"
import { useRaces } from "@/api/races"
import { useRouter } from "expo-router"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.75
const CARD_MARGIN = 12

const Home = () => {
    const { session } = useAuth()
    const user = session?.user
    const router = useRouter()

    const {
        data: ongoingRaces = [],
        isLoading: isLoadingOngoing,
        isError: isErrorOngoing,
    } = useRaces({
        status: "ongoing",
        userId: user?.id,
        limit: 10,
    })

    const {
        data: upcomingRaces = [],
        isLoading: isLoadingUpcoming,
        isError: isErrorUpcoming,
    } = useRaces({
        status: "upcoming",
        userId: user?.id,
        limit: 10,
    })

    if (isLoadingOngoing || isLoadingUpcoming) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.loadingContainer}>
                    <LinearGradient
                        colors={["#0891b2", "#16a34a"]}
                        style={styles.loadingGradient}
                    >
                        <Text style={styles.loadingIcon}>🏃</Text>
                    </LinearGradient>
                    <Text style={styles.loadingText}>LOADING RACES...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (isErrorOngoing || isErrorUpcoming) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.loadingContainer}>
                    <View style={styles.errorIcon}>
                        <Text style={styles.errorIconText}>⚠️</Text>
                    </View>
                    <Text style={styles.errorTitle}>Failed to Load</Text>
                    <Text style={styles.errorText}>Please try again later</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header Section */}
                <Animated.View
                    entering={FadeInDown.delay(100)}
                    style={styles.headerSection}
                >
                    <View style={styles.headerTop}>
                        <View style={styles.titleContainer}>
                            <View>
                                <Text style={styles.welcomeText}>
                                    Welcome back
                                    {user?.user_metadata?.full_name
                                        ? `, ${
                                              user.user_metadata.full_name.split(
                                                  " "
                                              )[0]
                                          }`
                                        : ""}
                                    !
                                </Text>
                                <Text style={styles.title}>YOUR RACES</Text>
                            </View>
                        </View>
                    </View>

                    {/* Quick Stats */}
                    <View style={styles.statsContainer}>
                        <LinearGradient
                            colors={["#DCFCE7", "#BBF7D0"]}
                            style={styles.statCard}
                        >
                            <Text style={styles.statIcon}>🔥</Text>
                            <Text style={styles.statValue}>
                                {ongoingRaces.length}
                            </Text>
                            <Text style={styles.statLabel}>LIVE NOW</Text>
                        </LinearGradient>

                        <LinearGradient
                            colors={["#DBEAFE", "#BFDBFE"]}
                            style={styles.statCard}
                        >
                            <Text style={styles.statIcon}>📅</Text>
                            <Text style={styles.statValue}>
                                {upcomingRaces.length}
                            </Text>
                            <Text style={styles.statLabel}>UPCOMING</Text>
                        </LinearGradient>

                        <LinearGradient
                            colors={["#FEF3C7", "#FDE68A"]}
                            style={styles.statCard}
                        >
                            <Text style={styles.statIcon}>🏆</Text>
                            <Text style={styles.statValue}>
                                {ongoingRaces.length + upcomingRaces.length}
                            </Text>
                            <Text style={styles.statLabel}>TOTAL</Text>
                        </LinearGradient>
                    </View>
                </Animated.View>

                {/* Ongoing Races Section */}
                <Animated.View
                    entering={FadeInDown.delay(200)}
                    style={styles.sectionContainer}
                >
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <View>
                                <Text style={styles.sectionTitle}>
                                    Live Races
                                </Text>
                                <Text style={styles.sectionSubtitle}>
                                    Races happening right now
                                </Text>
                            </View>
                        </View>
                        {ongoingRaces.length > 0 && (
                            <Text style={styles.badgeCount}>
                                {ongoingRaces.length}
                            </Text>
                        )}
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
                        decelerationRate="fast"
                    >
                        {ongoingRaces.length > 0 ? (
                            ongoingRaces.map((race, index) => (
                                <Animated.View
                                    key={race.id}
                                    entering={FadeInRight.delay(
                                        300 + index * 100
                                    )}
                                >
                                    <TouchableOpacity
                                        style={styles.raceCard}
                                        onPress={() =>
                                            router.push({
                                                pathname: `/run/multi/live/[id]`,
                                                params: { id: race.id },
                                            })
                                        }
                                        activeOpacity={0.9}
                                    >
                                        {/* Image Section */}
                                        <View style={styles.imageContainer}>
                                            {race.banner_url ||
                                            race.routes?.map_url ? (
                                                <Image
                                                    source={{
                                                        uri:
                                                            race.banner_url ||
                                                            race.routes
                                                                ?.map_url ||
                                                            "https://via.placeholder.com/400x150",
                                                    }}
                                                    style={styles.raceImage}
                                                />
                                            ) : (
                                                <LinearGradient
                                                    colors={[
                                                        "#0891b2",
                                                        "#16a34a",
                                                    ]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={styles.raceImage}
                                                />
                                            )}

                                            <LinearGradient
                                                colors={[
                                                    "transparent",
                                                    "rgba(0,0,0,0.7)",
                                                ]}
                                                style={styles.imageOverlay}
                                            />

                                            {/* Live Badge */}
                                            <View
                                                style={
                                                    styles.liveBadgeContainer
                                                }
                                            >
                                                <LinearGradient
                                                    colors={[
                                                        "#16a34a",
                                                        "#15803d",
                                                    ]}
                                                    style={styles.liveBadge}
                                                >
                                                    <View
                                                        style={styles.liveDot}
                                                    />
                                                    <Text
                                                        style={
                                                            styles.liveBadgeText
                                                        }
                                                    >
                                                        LIVE
                                                    </Text>
                                                </LinearGradient>
                                            </View>

                                            {/* Distance Badge */}
                                            {race.routes?.distance && (
                                                <View
                                                    style={
                                                        styles.distanceBadgeContainer
                                                    }
                                                >
                                                    <View
                                                        style={
                                                            styles.distanceBadge
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.distanceBadgeText
                                                            }
                                                        >
                                                            🏁{" "}
                                                            {race.routes.distance.toFixed(
                                                                1
                                                            )}{" "}
                                                            KM
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>

                                        {/* Content Section */}
                                        <View style={styles.cardContent}>
                                            <Text
                                                style={styles.raceName}
                                                numberOfLines={2}
                                            >
                                                {race.name}
                                            </Text>

                                            <View style={styles.infoContainer}>
                                                <View style={styles.infoRow}>
                                                    <Text
                                                        style={styles.infoIcon}
                                                    >
                                                        📅
                                                    </Text>
                                                    <Text
                                                        style={styles.infoText}
                                                    >
                                                        {new Date(
                                                            race.start_time
                                                        ).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                            }
                                                        )}{" "}
                                                        at{" "}
                                                        {new Date(
                                                            race.start_time
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </Text>
                                                </View>

                                                {race.routes?.start_address && (
                                                    <View
                                                        style={styles.infoRow}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.infoIcon
                                                            }
                                                        >
                                                            📍
                                                        </Text>
                                                        <Text
                                                            style={
                                                                styles.infoText
                                                            }
                                                            numberOfLines={1}
                                                        >
                                                            {
                                                                race.routes
                                                                    .start_address
                                                            }
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* CTA */}
                                            <LinearGradient
                                                colors={["#16a34a", "#15803d"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.ctaButton}
                                            >
                                                <Text
                                                    style={styles.ctaButtonText}
                                                >
                                                    JOIN NOW →
                                                </Text>
                                            </LinearGradient>
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))
                        ) : (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyIcon}>🏃</Text>
                                <Text style={styles.emptyTitle}>
                                    No Live Races
                                </Text>
                                <Text style={styles.emptyText}>
                                    Check upcoming races below
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>

                {/* Upcoming Races Section */}
                <Animated.View
                    entering={FadeInDown.delay(400)}
                    style={styles.sectionContainer}
                >
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <View>
                                <Text style={styles.sectionTitle}>
                                    Upcoming Races
                                </Text>
                                <Text style={styles.sectionSubtitle}>
                                    Races you're registered for
                                </Text>
                            </View>
                        </View>
                        {upcomingRaces.length > 0 && (
                            <Text style={styles.badgeCount}>
                                {upcomingRaces.length}
                            </Text>
                        )}
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
                        decelerationRate="fast"
                    >
                        {upcomingRaces.length > 0 ? (
                            upcomingRaces.map((race, index) => {
                                const daysUntil = Math.ceil(
                                    (new Date(race.start_time).getTime() -
                                        Date.now()) /
                                        (1000 * 60 * 60 * 24)
                                )
                                const isUrgent = daysUntil <= 3

                                return (
                                    <Animated.View
                                        key={race.id}
                                        entering={FadeInRight.delay(
                                            500 + index * 100
                                        )}
                                    >
                                        <TouchableOpacity
                                            style={styles.raceCard}
                                            onPress={() =>
                                                router.push({
                                                    pathname: `/race/details`,
                                                    params: { id: race.id },
                                                })
                                            }
                                            activeOpacity={0.9}
                                        >
                                            {/* Image Section */}
                                            <View style={styles.imageContainer}>
                                                {race.banner_url ||
                                                race.routes?.map_url ? (
                                                    <Image
                                                        source={{
                                                            uri:
                                                                race.banner_url ||
                                                                race.routes
                                                                    ?.map_url ||
                                                                "https://via.placeholder.com/400x150",
                                                        }}
                                                        style={styles.raceImage}
                                                    />
                                                ) : (
                                                    <LinearGradient
                                                        colors={[
                                                            "#0891b2",
                                                            "#16a34a",
                                                        ]}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 1 }}
                                                        style={styles.raceImage}
                                                    />
                                                )}

                                                <LinearGradient
                                                    colors={[
                                                        "transparent",
                                                        "rgba(0,0,0,0.7)",
                                                    ]}
                                                    style={styles.imageOverlay}
                                                />

                                                {/* Countdown Badge */}
                                                <View
                                                    style={
                                                        styles.countdownBadgeContainer
                                                    }
                                                >
                                                    <LinearGradient
                                                        colors={
                                                            isUrgent
                                                                ? [
                                                                      "#dc2626",
                                                                      "#991b1b",
                                                                  ]
                                                                : [
                                                                      "#0891b2",
                                                                      "#0e7490",
                                                                  ]
                                                        }
                                                        style={
                                                            styles.countdownBadge
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.countdownValue
                                                            }
                                                        >
                                                            {daysUntil}
                                                        </Text>
                                                        <Text
                                                            style={
                                                                styles.countdownLabel
                                                            }
                                                        >
                                                            {daysUntil === 1
                                                                ? "DAY"
                                                                : "DAYS"}
                                                        </Text>
                                                    </LinearGradient>
                                                </View>

                                                {/* Distance Badge */}
                                                {race.routes?.distance && (
                                                    <View
                                                        style={
                                                            styles.distanceBadgeContainer
                                                        }
                                                    >
                                                        <View
                                                            style={
                                                                styles.distanceBadge
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.distanceBadgeText
                                                                }
                                                            >
                                                                🏁{" "}
                                                                {race.routes.distance.toFixed(
                                                                    1
                                                                )}{" "}
                                                                KM
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Content Section */}
                                            <View style={styles.cardContent}>
                                                <Text
                                                    style={styles.raceName}
                                                    numberOfLines={2}
                                                >
                                                    {race.name}
                                                </Text>

                                                <View
                                                    style={styles.infoContainer}
                                                >
                                                    <View
                                                        style={styles.infoRow}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.infoText
                                                            }
                                                        >
                                                            {new Date(
                                                                race.start_time
                                                            ).toLocaleDateString(
                                                                "en-US",
                                                                {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    year: "numeric",
                                                                }
                                                            )}{" "}
                                                            at{" "}
                                                            {new Date(
                                                                race.start_time
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </Text>
                                                    </View>

                                                    {race.routes
                                                        ?.start_address && (
                                                        <View
                                                            style={
                                                                styles.infoRow
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.infoText
                                                                }
                                                                numberOfLines={
                                                                    1
                                                                }
                                                            >
                                                                {
                                                                    race.routes
                                                                        .start_address
                                                                }
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* CTA */}
                                                {/* <LinearGradient
                                                    colors={[
                                                        "#0891b2",
                                                        "#16a34a",
                                                    ]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.ctaButton}
                                                >
                                                    <Text
                                                        style={
                                                            styles.ctaButtonText
                                                        }
                                                    >
                                                        VIEW DETAILS →
                                                    </Text>
                                                </LinearGradient> */}
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                )
                            })
                        ) : (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>
                                    No Upcoming Races
                                </Text>
                                <Text style={styles.emptyText}>
                                    Browse races to join one
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    )
}

export default Home

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    scrollContent: {
        paddingBottom: 20,
    },
    headerSection: {
        backgroundColor: "#FFFFFF",
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: "#E5E7EB",
    },
    headerTop: {
        marginBottom: 20,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    titleIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    titleIconText: {
        fontSize: 28,
    },
    welcomeText: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "600",
        marginBottom: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: -0.5,
    },
    statsContainer: {
        flexDirection: "row",
        gap: 10,
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
    statIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "900",
        color: "#111827",
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 0.5,
    },
    sectionContainer: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    sectionIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    sectionIcon: {
        fontSize: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: -0.3,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 2,
    },
    badgeCount: {
        fontSize: 18,
        fontWeight: "900",
        color: "#0891b2",
        backgroundColor: "#E0F2FE",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: "hidden",
    },
    carouselContent: {
        paddingHorizontal: 20,
        gap: CARD_MARGIN * 2,
    },
    raceCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        width: CARD_WIDTH,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    imageContainer: {
        position: "relative",
        width: "100%",
        height: 180,
    },
    raceImage: {
        width: "100%",
        height: "100%",
    },
    imageOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "50%",
    },
    liveBadgeContainer: {
        position: "absolute",
        top: 12,
        left: 12,
    },
    liveBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FFF",
    },
    liveBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    countdownBadgeContainer: {
        position: "absolute",
        top: 12,
        right: 12,
    },
    countdownBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: "center",
    },
    countdownValue: {
        fontSize: 24,
        fontWeight: "900",
        color: "#FFFFFF",
        lineHeight: 28,
    },
    countdownLabel: {
        fontSize: 9,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    distanceBadgeContainer: {
        position: "absolute",
        bottom: 12,
        left: 12,
    },
    distanceBadge: {
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    distanceBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    cardContent: {
        padding: 16,
    },
    raceName: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 12,
        letterSpacing: -0.3,
        lineHeight: 26,
    },
    infoContainer: {
        gap: 8,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    infoIcon: {
        fontSize: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "500",
    },
    ctaButton: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    ctaButtonText: {
        fontSize: 15,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    emptyCard: {
        width: CARD_WIDTH,
        height: 280,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 8,
        textAlign: "center",
    },
    emptyText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    loadingIcon: {
        fontSize: 40,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 1,
    },
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
    },
})
