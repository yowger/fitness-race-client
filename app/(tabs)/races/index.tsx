import { View, FlatList, StyleSheet, Pressable, Image } from "react-native"
import {
    Text,
    Card,
    useTheme,
    Chip,
    Searchbar,
    Avatar,
} from "react-native-paper"
import { useState, useMemo } from "react"

type Race = {
    id: string
    name: string
    date: string
    location: string
    status: "upcoming" | "ongoing" | "finished"
    distance?: string
    participants?: number
    imageUrl?: string
    host: {
        name: string
        avatar?: string
    }
}

const MOCK_RACES: Race[] = [
    {
        id: "1",
        name: "City Fun Run",
        date: "Aug 25, 2025",
        location: "Cebu City",
        status: "upcoming",
        distance: "5K",
        participants: 234,
        imageUrl:
            "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80",
        host: {
            name: "Cebu Sports Council",
            avatar: "https://ui-avatars.com/api/?name=Cebu+Sports+Council&background=0D8ABC&color=fff",
        },
    },
    {
        id: "2",
        name: "Barangay Marathon",
        date: "Aug 10, 2025",
        location: "Mandaue",
        status: "finished",
        distance: "21K",
        participants: 156,
        imageUrl:
            "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
        host: {
            name: "Mandaue Athletic Club",
            avatar: "https://ui-avatars.com/api/?name=Mandaue+Athletic+Club&background=FF6B35&color=fff",
        },
    },
    {
        id: "3",
        name: "Coastal Sprint",
        date: "Aug 18, 2025",
        location: "Lapu-Lapu City",
        status: "ongoing",
        distance: "10K",
        participants: 189,
        imageUrl:
            "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80",
        host: {
            name: "Coastal Runners PH",
            avatar: "https://ui-avatars.com/api/?name=Coastal+Runners+PH&background=6B7280&color=fff",
        },
    },
]

type FilterStatus = "all" | "upcoming" | "ongoing" | "finished"

export default function RacesIndex() {
    const theme = useTheme()
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")

    const filteredRaces = useMemo(() => {
        return MOCK_RACES.filter((race) => {
            const matchesSearch =
                race.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                race.location
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                race.host.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesFilter =
                filterStatus === "all" || race.status === filterStatus
            return matchesSearch && matchesFilter
        })
    }, [searchQuery, filterStatus])

    const getStatusColor = (status: Race["status"]) => {
        switch (status) {
            case "upcoming":
                return theme.colors.primary
            case "ongoing":
                return "#FF6B35"
            case "finished":
                return "#6B7280"
        }
    }

    const getStatusBgColor = (status: Race["status"]) => {
        switch (status) {
            case "upcoming":
                return `${theme.colors.primary}15`
            case "ongoing":
                return "#FF6B3515"
            case "finished":
                return "#6B728015"
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Searchbar
                    placeholder="Search races, locations, or hosts..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                    elevation={0}
                />

                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={["all", "upcoming", "ongoing", "finished"] as const}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.filterContainer}
                    renderItem={({ item }) => (
                        <Chip
                            selected={filterStatus === item}
                            onPress={() => setFilterStatus(item)}
                            style={styles.filterChip}
                            showSelectedCheck={false}
                        >
                            {item.charAt(0).toUpperCase() + item.slice(1)}
                        </Chip>
                    )}
                />
            </View>

            <FlatList
                data={filteredRaces}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => {
                            // Navigate to race details
                            console.log("Navigate to race:", item.id)
                        }}
                    >
                        <Card style={styles.card} mode="elevated">
                            {item.imageUrl && (
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: item.imageUrl }}
                                        style={styles.raceImage}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.statusBadge}>
                                        <Chip
                                            compact
                                            style={{
                                                backgroundColor:
                                                    getStatusBgColor(
                                                        item.status
                                                    ),
                                            }}
                                            textStyle={{
                                                color: getStatusColor(
                                                    item.status
                                                ),
                                                fontSize: 11,
                                                fontWeight: "600",
                                            }}
                                        >
                                            {item.status.toUpperCase()}
                                        </Chip>
                                    </View>
                                </View>
                            )}

                            <Card.Content>
                                <View style={styles.cardHeader}>
                                    <Text
                                        variant="titleLarge"
                                        style={styles.raceName}
                                    >
                                        {item.name}
                                    </Text>
                                </View>

                                <View style={styles.hostContainer}>
                                    {item.host.avatar ? (
                                        <Avatar.Image
                                            size={24}
                                            source={{ uri: item.host.avatar }}
                                        />
                                    ) : (
                                        <Avatar.Text
                                            size={24}
                                            label={item.host.name.charAt(0)}
                                        />
                                    )}
                                    <Text
                                        variant="bodySmall"
                                        style={styles.hostText}
                                    >
                                        Hosted by {item.host.name}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text
                                        variant="bodyMedium"
                                        style={styles.infoText}
                                    >
                                        📅 {item.date}
                                    </Text>
                                    <Text
                                        variant="bodyMedium"
                                        style={styles.infoText}
                                    >
                                        📍 {item.location}
                                    </Text>
                                </View>

                                {(item.distance || item.participants) && (
                                    <View style={styles.metaRow}>
                                        {item.distance && (
                                            <View style={styles.metaItem}>
                                                <Text style={styles.metaLabel}>
                                                    Distance
                                                </Text>
                                                <Text style={styles.metaValue}>
                                                    {item.distance}
                                                </Text>
                                            </View>
                                        )}
                                        {item.participants && (
                                            <View style={styles.metaItem}>
                                                <Text style={styles.metaLabel}>
                                                    Participants
                                                </Text>
                                                <Text style={styles.metaValue}>
                                                    {item.participants}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    </Pressable>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text variant="headlineSmall" style={styles.emptyTitle}>
                            No races found
                        </Text>
                        <Text variant="bodyMedium" style={styles.emptyText}>
                            {searchQuery
                                ? "Try adjusting your search or filters"
                                : "Check back later for upcoming races"}
                        </Text>
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
        paddingTop: 16,
        paddingHorizontal: 16,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    searchbar: {
        marginBottom: 12,
        backgroundColor: "#F3F4F6",
    },
    filterContainer: {
        paddingBottom: 16,
        gap: 8,
    },
    filterChip: {
        marginRight: 8,
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    card: {
        backgroundColor: "#FFF",
        overflow: "hidden",
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
    statusBadge: {
        position: "absolute",
        top: 12,
        right: 12,
    },
    cardHeader: {
        marginTop: 16,
        marginBottom: 8,
    },
    raceName: {
        fontWeight: "600",
    },
    hostContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    hostText: {
        color: "#6B7280",
        fontWeight: "500",
    },
    infoRow: {
        gap: 8,
        marginBottom: 12,
    },
    infoText: {
        color: "#6B7280",
    },
    metaRow: {
        flexDirection: "row",
        gap: 24,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    metaItem: {
        gap: 4,
    },
    metaLabel: {
        fontSize: 12,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    metaValue: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "600",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        marginBottom: 8,
        fontWeight: "600",
        color: "#374151",
    },
    emptyText: {
        textAlign: "center",
        color: "#6B7280",
    },
})
