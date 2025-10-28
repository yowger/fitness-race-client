import React, { useState } from "react"
import { View, FlatList, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { Card, Button, Text } from "react-native-paper"

const dummyRoutes = [
    { id: "1", name: "Park Loop", distance: "5 km" },
    { id: "2", name: "River Run", distance: "8 km" },
]

export default function SingleRunSetup() {
    const router = useRouter()
    const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
    const [routes, setRoutes] = useState(dummyRoutes)

    const startRun = () => {
        if (selectedRoute) {
            router.push(`/routes/${selectedRoute}?next=/run/single/active`)
        } else {
            router.push("/run/single/active")
        }
    }

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                Pick a Route (Optional)
            </Text>

            <Button
                mode="outlined"
                onPress={() => router.push("/routes")}
                style={styles.actionButton}
            >
                See All Routes
            </Button>

            <FlatList
                data={routes}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                    <Card
                        style={[
                            styles.routeCard,
                            selectedRoute === item.id && styles.selectedCard,
                        ]}
                        onPress={() => setSelectedRoute(item.id)}
                    >
                        <Card.Content>
                            <Text
                                variant="titleMedium"
                                style={styles.routeName}
                            >
                                {item.name}
                            </Text>
                            <Text>{item.distance}</Text>
                        </Card.Content>

                        <Card.Actions>
                            <Button
                                mode="outlined"
                                onPress={() =>
                                    router.push(`/routes/${item.id}`)
                                }
                            >
                                View Details
                            </Button>
                        </Card.Actions>
                    </Card>
                )}
                ListEmptyComponent={
                    <Text style={{ color: "#666", marginBottom: 10 }}>
                        No routes available
                    </Text>
                }
            />

            <Button
                mode="contained"
                onPress={startRun}
                style={[styles.actionButton, { marginTop: 20 }]}
            >
                Start Run
            </Button>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { marginBottom: 20 },
    actionButton: { marginBottom: 10 },
    routeCard: {
        marginBottom: 10,
        borderRadius: 12,
    },
    selectedCard: {
        borderWidth: 2,
        borderColor: "#4CAF50",
    },
    routeName: { fontWeight: "600" },
})
