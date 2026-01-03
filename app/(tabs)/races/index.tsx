import { View, FlatList, StyleSheet, Pressable, Image } from "react-native"
import {
    Text,
    Card,
    useTheme,
    Chip,
    Searchbar,
    Avatar,
    ActivityIndicator,
} from "react-native-paper"
import { useState, useMemo } from "react"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { useRaces } from "@/api/races"
import { useAuth } from "@/providers/AuthProvider"
import type { Race } from "@/api/races"

type FilterStatus = "all" | "upcoming" | "ongoing" | "finished" | "complete"

export default function RacesIndex() {
    const theme = useTheme()
    const router = useRouter()
    const { session } = useAuth()
    const user = session?.user

    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")

    const {
        data: races = [],
        isLoading,
        isError,
    } = useRaces({
        // userId: user?.id,
        // status: filterStatus === "all" ? undefined : filterStatus,
    })

    const filteredRaces = useMemo(() => {
        return races.filter((race) => {
            const search = searchQuery.toLowerCase()

            const matchesSearch =
                race.name.toLowerCase().includes(search) ||
                race.created_by_user?.full_name?.toLowerCase().includes(search)

            const matchesFilter =
                filterStatus === "all" || race.status === filterStatus

            return matchesSearch && matchesFilter
        })
    }, [races, searchQuery, filterStatus])

    const getStatusConfig = (status: Race["status"]) => {
        switch (status) {
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

    // Calculate stats
    const stats = useMemo(
        () => ({
            total: races.length,
            upcoming: races.filter((r) => r.status === "upcoming").length,
            ongoing: races.filter((r) => r.status === "ongoing").length,
            finished: races.filter(
                (r) => r.status === "finished" || r.status === "complete"
            ).length,
        }),
        [races]
    )

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={["#0891b2", "#16a34a"]}
                    style={styles.loadingGradient}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.loadingText}>LOADING RACES...</Text>
            </View>
        )
    }

    if (isError) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.errorIcon}>
                    <Text style={styles.errorIconText}>⚠️</Text>
                </View>
                <Text style={styles.errorTitle}>Failed to Load Races</Text>
                <Text style={styles.errorText}>Please try again later</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Header with Stats */}
            <View style={styles.header}>
                {/* Title */}
                <View style={styles.titleContainer}>
                    <LinearGradient
                        colors={["#0891b2", "#16a34a"]}
                        style={styles.titleIcon}
                    >
                        <Text style={styles.titleIconText}>🏁</Text>
                    </LinearGradient>
                    <View>
                        <Text style={styles.title}>RACE EVENTS</Text>
                        <Text style={styles.subtitle}>
                            Discover exciting races near you
                        </Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <LinearGradient
                        colors={["#E0F2FE", "#BAE6FD"]}
                        style={styles.statCard}
                    >
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>TOTAL</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={["#DBEAFE", "#BFDBFE"]}
                        style={styles.statCard}
                    >
                        <Text style={styles.statValue}>{stats.upcoming}</Text>
                        <Text style={styles.statLabel}>UPCOMING</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={["#DCFCE7", "#BBF7D0"]}
                        style={styles.statCard}
                    >
                        <Text style={styles.statValue}>{stats.ongoing}</Text>
                        <Text style={styles.statLabel}>LIVE</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={["#F3E8FF", "#E9D5FF"]}
                        style={styles.statCard}
                    >
                        <Text style={styles.statValue}>{stats.finished}</Text>
                        <Text style={styles.statLabel}>DONE</Text>
                    </LinearGradient>
                </View>

                {/* Search */}
                <Searchbar
                    placeholder="Search races, organizers, locations..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                    inputStyle={styles.searchInput}
                    iconColor="#6B7280"
                    elevation={0}
                />

                {/* Filters */}
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={["all", "upcoming", "ongoing", "complete"]}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.filterContainer}
                    renderItem={({ item }) => {
                        const isActive = filterStatus === item
                        return (
                            <Pressable
                                onPress={() =>
                                    setFilterStatus(item as FilterStatus)
                                }
                                style={styles.filterChipContainer}
                            >
                                {isActive ? (
                                    <LinearGradient
                                        colors={["#0891b2", "#16a34a"]}
                                        style={styles.filterChipActive}
                                    >
                                        <Text style={styles.filterTextActive}>
                                            {item.toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.filterChipInactive}>
                                        <Text style={styles.filterTextInactive}>
                                            {item.toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                        )
                    }}
                />
            </View>

            {/* Race List */}
            <FlatList
                data={filteredRaces}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {
                    const statusConfig = getStatusConfig(item.status)
                    const participantPercentage = item.max_participants
                        ? ((item.participants?.length ?? 0) /
                              item.max_participants) *
                          100
                        : 0

                    return (
                        <Animated.View entering={FadeInDown.delay(index * 100)}>
                            <Pressable
                                onPress={() =>
                                    router.push({
                                        pathname: "/race/details",
                                        params: { id: item.id },
                                    })
                                }
                                style={styles.cardPressable}
                            >
                                <View style={styles.card}>
                                    {/* Image Section */}
                                    <View style={styles.imageContainer}>
                                        {item.banner_url ? (
                                            <Image
                                                source={{
                                                    uri: item.banner_url,
                                                }}
                                                style={styles.raceImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <LinearGradient
                                                colors={["#0891b2", "#16a34a"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.raceImage}
                                            />
                                        )}

                                        {/* Gradient Overlay */}
                                        <LinearGradient
                                            colors={[
                                                "transparent",
                                                "rgba(0,0,0,0.4)",
                                            ]}
                                            style={styles.imageOverlay}
                                        />

                                        {/* Status Badge */}
                                        <View
                                            style={styles.statusBadgeContainer}
                                        >
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    {
                                                        backgroundColor:
                                                            statusConfig.bgColor,
                                                        borderColor:
                                                            statusConfig.borderColor,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.statusText,
                                                        {
                                                            color: statusConfig.color,
                                                        },
                                                    ]}
                                                >
                                                    {statusConfig.label}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Price Badge */}
                                        <View
                                            style={styles.priceBadgeContainer}
                                        >
                                            <View style={styles.priceBadge}>
                                                <Text
                                                    style={
                                                        styles.priceBadgeText
                                                    }
                                                >
                                                    {item.price
                                                        ? `₱${item.price}`
                                                        : "FREE"}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Distance Badge */}
                                        {item.routes?.distance && (
                                            <View
                                                style={
                                                    styles.distanceBadgeContainer
                                                }
                                            >
                                                <View
                                                    style={styles.distanceBadge}
                                                >
                                                    <Text
                                                        style={
                                                            styles.distanceBadgeText
                                                        }
                                                    >
                                                        🏁{" "}
                                                        {item.routes.distance.toFixed(
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
                                        {/* Title */}
                                        <Text
                                            style={styles.raceName}
                                            numberOfLines={2}
                                        >
                                            {item.name}
                                        </Text>

                                        {/* Description */}
                                        {/* {item.description && (
                                            <Text
                                                style={styles.raceDescription}
                                                numberOfLines={2}
                                            >
                                                {item.description}
                                            </Text>
                                        )} */}

                                        {/* Info Section */}
                                        <View style={styles.infoSection}>
                                            <View style={styles.infoRow}>
                                                <View
                                                    style={
                                                        styles.infoIconCircle
                                                    }
                                                >
                                                    <Text
                                                        style={styles.infoIcon}
                                                    >
                                                        📅
                                                    </Text>
                                                </View>
                                                <Text style={styles.infoText}>
                                                    {new Date(
                                                        item.start_time
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
                                                        item.start_time
                                                    ).toLocaleTimeString(
                                                        "en-US",
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )}
                                                </Text>
                                            </View>

                                            {item.routes?.start_address && (
                                                <View style={styles.infoRow}>
                                                    <View
                                                        style={
                                                            styles.infoIconCircle
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.infoIcon
                                                            }
                                                        >
                                                            📍
                                                        </Text>
                                                    </View>
                                                    <Text
                                                        style={styles.infoText}
                                                        numberOfLines={1}
                                                    >
                                                        {
                                                            item.routes
                                                                .start_address
                                                        }
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Progress Bar */}
                                        {item.max_participants && (
                                            <View
                                                style={styles.progressSection}
                                            >
                                                <View
                                                    style={
                                                        styles.progressHeader
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.progressLabel
                                                        }
                                                    >
                                                        👥{" "}
                                                        {item.participants
                                                            ?.length ?? 0}{" "}
                                                        /{" "}
                                                        {item.max_participants}
                                                    </Text>
                                                    <Text
                                                        style={
                                                            styles.progressPercentage
                                                        }
                                                    >
                                                        {Math.round(
                                                            participantPercentage
                                                        )}
                                                        %
                                                    </Text>
                                                </View>
                                                <View
                                                    style={styles.progressBarBg}
                                                >
                                                    <LinearGradient
                                                        colors={[
                                                            "#0891b2",
                                                            "#16a34a",
                                                        ]}
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
                                        )}

                                        {/* Organizer */}
                                        <View style={styles.organizerSection}>
                                            <LinearGradient
                                                colors={["#0891b2", "#16a34a"]}
                                                style={styles.organizerAvatar}
                                            >
                                                {item.created_by_user
                                                    ?.avatar_url ? (
                                                    <Avatar.Image
                                                        size={32}
                                                        source={{
                                                            uri: item
                                                                .created_by_user
                                                                .avatar_url,
                                                        }}
                                                        style={styles.avatar}
                                                    />
                                                ) : (
                                                    <Text
                                                        style={
                                                            styles.organizerAvatarText
                                                        }
                                                    >
                                                        {item.created_by_user?.full_name?.charAt(
                                                            0
                                                        ) ?? "?"}
                                                    </Text>
                                                )}
                                            </LinearGradient>
                                            <View style={styles.organizerInfo}>
                                                <Text
                                                    style={
                                                        styles.organizerLabel
                                                    }
                                                >
                                                    ORGANIZED BY
                                                </Text>
                                                <Text
                                                    style={styles.organizerName}
                                                    numberOfLines={1}
                                                >
                                                    {item.created_by_user
                                                        ?.full_name ??
                                                        "Unknown"}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* CTA Button */}
                                        {/* <Pressable style={styles.viewButton}>
                                            <LinearGradient
                                                colors={["#0891b2", "#16a34a"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={
                                                    styles.viewButtonGradient
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.viewButtonText
                                                    }
                                                >
                                                    VIEW DETAILS →
                                                </Text>
                                            </LinearGradient>
                                        </Pressable> */}
                                    </View>
                                </View>
                            </Pressable>
                        </Animated.View>
                    )
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Text style={styles.emptyIconText}>🏃</Text>
                        </View>
                        <Text style={styles.emptyTitle}>No Races Found</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery
                                ? "Try adjusting your search or filters"
                                : "Check back later for new races"}
                        </Text>
                        {searchQuery && (
                            <Pressable
                                onPress={() => {
                                    setSearchQuery("")
                                    setFilterStatus("all")
                                }}
                                style={styles.clearButton}
                            >
                                <LinearGradient
                                    colors={["#0891b2", "#16a34a"]}
                                    style={styles.clearButtonGradient}
                                >
                                    <Text style={styles.clearButtonText}>
                                        CLEAR FILTERS
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        )}
                    </View>
                }
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        backgroundColor: "#FFFFFF",
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: "#E5E7EB",
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    titleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    titleIconText: {
        fontSize: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 2,
    },
    statsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 10,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "rgba(0, 0, 0, 0.05)",
    },
    statValue: {
        fontSize: 20,
        fontWeight: "900",
        color: "#111827",
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 9,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 0.5,
    },
    searchbar: {
        backgroundColor: "#F3F4F6",
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    searchInput: {
        fontSize: 15,
    },
    filterContainer: {
        gap: 8,
        paddingBottom: 4,
    },
    filterChipContainer: {
        marginRight: 8,
    },
    filterChipActive: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#0891b2",
    },
    filterChipInactive: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#E5E7EB",
        borderWidth: 2,
        borderColor: "#D1D5DB",
    },
    filterTextActive: {
        fontSize: 13,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    filterTextInactive: {
        fontSize: 13,
        fontWeight: "800",
        color: "#6B7280",
        letterSpacing: 0.5,
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    cardPressable: {
        marginBottom: 4,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
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
    statusBadgeContainer: {
        position: "absolute",
        top: 12,
        left: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 2,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    priceBadgeContainer: {
        position: "absolute",
        top: 12,
        right: 12,
    },
    priceBadge: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    priceBadgeText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#111827",
    },
    distanceBadgeContainer: {
        position: "absolute",
        bottom: 12,
        left: 12,
    },
    distanceBadge: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
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
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    raceDescription: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
        marginBottom: 12,
    },
    infoSection: {
        gap: 8,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    infoIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    infoIcon: {
        fontSize: 14,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "500",
    },
    progressSection: {
        marginBottom: 12,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
    },
    progressPercentage: {
        fontSize: 14,
        fontWeight: "900",
        color: "#0891b2",
    },
    progressBarBg: {
        height: 6,
        backgroundColor: "#E5E7EB",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 3,
    },
    organizerSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingTop: 12,
        marginBottom: 12,
        borderTopWidth: 2,
        borderTopColor: "#F3F4F6",
    },
    organizerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    avatar: {
        backgroundColor: "transparent",
    },
    organizerAvatarText: {
        fontSize: 16,
        fontWeight: "900",
        color: "#FFFFFF",
    },
    organizerInfo: {
        flex: 1,
    },
    organizerLabel: {
        fontSize: 10,
        fontWeight: "800",
        color: "#9CA3AF",
        letterSpacing: 0.5,
    },
    organizerName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
    },
    viewButton: {
        borderRadius: 10,
        overflow: "hidden",
    },
    viewButtonGradient: {
        paddingVertical: 14,
        alignItems: "center",
    },
    viewButtonText: {
        fontSize: 15,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 80,
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyIconText: {
        fontSize: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#111827",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        textAlign: "center",
        color: "#6B7280",
        lineHeight: 22,
        marginBottom: 24,
    },
    clearButton: {
        borderRadius: 10,
        overflow: "hidden",
    },
    clearButtonGradient: {
        paddingHorizontal: 32,
        paddingVertical: 14,
    },
    clearButtonText: {
        fontSize: 15,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
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
