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
import { useAuth } from "@/providers/AuthProvider"
import { useRacesSimple } from "@/api/races"
import { useRouter } from "expo-router"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.8
const CARD_MARGIN = 10

const Home = () => {
    const { session } = useAuth()
    const user = session?.user
    const router = useRouter()

    const {
        data: upcomingRaces,
        isLoading,
        isError,
    } = useRacesSimple({
        status: "upcoming",
        userId: user?.id,
        limit: 10,
    })

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.container}>
                    <Text>Loading races...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (isError) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.container}>
                    <Text>Failed to load races.</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.header}>Upcoming Races</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeMore}>See More</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
                    decelerationRate="fast"
                >
                    {upcomingRaces && upcomingRaces.length > 0 ? (
                        upcomingRaces.map((race) => (
                            <TouchableOpacity
                                key={race.id}
                                style={styles.horizontalCard}
                                onPress={() =>
                                    router.push({
                                        pathname: `/run/multi/details/[id]`,
                                        params: { id: race.id },
                                    })
                                }
                            >
                                <Image
                                    source={{
                                        uri:
                                            race.routes?.map_url ||
                                            "https://via.placeholder.com/400x150",
                                    }}
                                    style={styles.mapImage}
                                />
                                <View style={styles.cardContent}>
                                    <Text style={styles.raceName}>
                                        {race.name}
                                    </Text>
                                    <Text>
                                        {race.routes?.distance
                                            ? `${race.routes.distance.toFixed(
                                                  2
                                              )} km`
                                            : "Distance unknown"}
                                    </Text>
                                    <Text>
                                        {new Date(
                                            race.start_time
                                        ).toLocaleDateString()}{" "}
                                        {new Date(
                                            race.start_time
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </Text>
                                    <Text>Status: {race.status}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text>No upcoming races found.</Text>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

export default Home

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    container: {
        paddingVertical: 20,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
    },
    seeMore: {
        fontSize: 14,
        color: "#1E90FF",
        fontWeight: "500",
    },
    horizontalCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        width: CARD_WIDTH,
        marginRight: CARD_MARGIN,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    mapImage: {
        width: "100%",
        height: 150,
    },
    cardContent: {
        padding: 10,
    },
    raceName: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
})
