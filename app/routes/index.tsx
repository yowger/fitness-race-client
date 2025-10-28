import React, { useState } from "react"
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from "react-native"

interface Route {
    id: string
    name: string
    distance: number
    difficulty: "Easy" | "Medium" | "Hard" | "Expert"
    type: "Circuit" | "Point to Point" | "Sprint"
    elevation: number
    record: string
    location: string
}

const SAMPLE_ROUTES: Route[] = [
    {
        id: "1",
        name: "Mountain Peak Challenge",
        distance: 42.5,
        difficulty: "Expert",
        type: "Point to Point",
        elevation: 1200,
        record: "2:15:32",
        location: "Alpine Region",
    },
    {
        id: "2",
        name: "City Circuit Pro",
        distance: 15.3,
        difficulty: "Medium",
        type: "Circuit",
        elevation: 150,
        record: "0:45:18",
        location: "Downtown",
    },
    {
        id: "3",
        name: "Coastal Sprint",
        distance: 8.2,
        difficulty: "Easy",
        type: "Sprint",
        elevation: 50,
        record: "0:22:45",
        location: "Beach Front",
    },
    {
        id: "4",
        name: "Valley Loop Classic",
        distance: 25.7,
        difficulty: "Medium",
        type: "Circuit",
        elevation: 380,
        record: "1:18:22",
        location: "Green Valley",
    },
    {
        id: "5",
        name: "Desert Endurance",
        distance: 68.0,
        difficulty: "Expert",
        type: "Point to Point",
        elevation: 890,
        record: "3:42:15",
        location: "Red Canyon",
    },
    {
        id: "6",
        name: "Forest Trail Rush",
        distance: 12.4,
        difficulty: "Hard",
        type: "Circuit",
        elevation: 420,
        record: "0:38:56",
        location: "Pine Forest",
    },
]

export default function index() {
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All")

    const difficulties = ["All", "Easy", "Medium", "Hard", "Expert"]

    const filteredRoutes =
        selectedDifficulty === "All"
            ? SAMPLE_ROUTES
            : SAMPLE_ROUTES.filter(
                  (route) => route.difficulty === selectedDifficulty
              )

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "Easy":
                return "#10b981"
            case "Medium":
                return "#f59e0b"
            case "Hard":
                return "#f97316"
            case "Expert":
                return "#ef4444"
            default:
                return "#6b7280"
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "Circuit":
                return "🔄"
            case "Point to Point":
                return "➡️"
            case "Sprint":
                return "⚡"
            default:
                return "🏁"
        }
    }

    const renderRoute = ({ item }: { item: Route }) => (
        <TouchableOpacity style={styles.routeCard} activeOpacity={0.7}>
            <View style={styles.routeHeader}>
                <Text style={styles.routeName}>{item.name}</Text>
                <View
                    style={[
                        styles.difficultyBadge,
                        {
                            backgroundColor: getDifficultyColor(
                                item.difficulty
                            ),
                        },
                    ]}
                >
                    <Text style={styles.difficultyText}>{item.difficulty}</Text>
                </View>
            </View>

            <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{item.location}</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Distance</Text>
                    <Text style={styles.statValue}>{item.distance} km</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Elevation</Text>
                    <Text style={styles.statValue}>{item.elevation}m</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Record</Text>
                    <Text style={styles.statValue}>{item.record}</Text>
                </View>
            </View>

            <View style={styles.typeRow}>
                <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
                <Text style={styles.typeText}>{item.type}</Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.title}>Racing Routes</Text>
                <Text style={styles.subtitle}>
                    {filteredRoutes.length} available routes
                </Text>
            </View>

            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={difficulties}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                selectedDifficulty === item &&
                                    styles.filterButtonActive,
                            ]}
                            onPress={() => setSelectedDifficulty(item)}
                        >
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    selectedDifficulty === item &&
                                        styles.filterButtonTextActive,
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            <FlatList
                data={filteredRoutes}
                renderItem={renderRoute}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f172a",
    },
    header: {
        padding: 20,
        paddingTop: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#ffffff",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "#94a3b8",
    },
    filterContainer: {
        marginBottom: 16,
    },
    filterList: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#1e293b",
        marginRight: 8,
    },
    filterButtonActive: {
        backgroundColor: "#3b82f6",
    },
    filterButtonText: {
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "600",
    },
    filterButtonTextActive: {
        color: "#ffffff",
    },
    listContainer: {
        padding: 20,
        paddingTop: 0,
    },
    routeCard: {
        backgroundColor: "#1e293b",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#334155",
    },
    routeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    routeName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#ffffff",
        flex: 1,
        marginRight: 12,
    },
    difficultyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    difficultyText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "700",
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    locationIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    locationText: {
        fontSize: 14,
        color: "#94a3b8",
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#0f172a",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#ffffff",
    },
    statDivider: {
        width: 1,
        backgroundColor: "#334155",
        marginHorizontal: 8,
    },
    typeRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    typeIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    typeText: {
        fontSize: 14,
        color: "#cbd5e1",
        fontWeight: "500",
    },
})
