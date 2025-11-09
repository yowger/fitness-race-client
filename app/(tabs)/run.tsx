import { MaterialIcons } from "@react-native-vector-icons/material-icons"
import { useRouter } from "expo-router"
import { Text, View, ScrollView, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Card, Button, Surface } from "react-native-paper"
import * as Location from "expo-location"

import { styles } from "@/styles/ui"

const Run = () => {
    const router = useRouter()

    const handleSingleRun = async () => {
        const granted = await requestLocationPermission()
        if (granted) router.push("/run/single")
    }

    const handleMultiRun = async () => {
        const granted = await requestLocationPermission()
        if (granted) router.push("/run/multi")
    }

    // Permission check function
    const requestLocationPermission = async () => {
        const { status } = await Location.getForegroundPermissionsAsync()
        if (status === "granted") return true

        const { status: requestStatus } =
            await Location.requestForegroundPermissionsAsync()
        if (requestStatus === "granted") return true

        Alert.alert(
            "Location Required",
            "We need your location to track your run. Please enable it in settings."
        )
        return false
    }

    return (
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Choose Your Run</Text>
                    <Text style={styles.subtitle}>
                        Select a running mode to get started
                    </Text>
                </View>

                <View style={styles.cardsContainer}>
                    <Card style={styles.card} elevation={4}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.iconContainer}>
                                <Surface
                                    style={[
                                        styles.iconSurface,
                                        { backgroundColor: "#4CAF50" },
                                    ]}
                                    elevation={2}
                                >
                                    <MaterialIcons
                                        name="directions-run"
                                        size={40}
                                        color="#fff"
                                    />
                                </Surface>
                            </View>

                            <Text style={styles.cardTitle}>Single Run</Text>
                            <Text style={styles.cardDescription}>
                                Track a single running session with real-time
                                stats, distance, and pace monitoring.
                            </Text>

                            <Button
                                mode="contained"
                                onPress={handleSingleRun}
                                style={[
                                    styles.button,
                                    { backgroundColor: "#4CAF50" },
                                ]}
                            >
                                Start Single Run
                            </Button>
                        </Card.Content>
                    </Card>

                    <Card style={styles.card} elevation={4}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.iconContainer}>
                                <Surface
                                    style={[
                                        styles.iconSurface,
                                        { backgroundColor: "#FF6B6B" },
                                    ]}
                                    elevation={2}
                                >
                                    <MaterialIcons
                                        name="timer"
                                        size={40}
                                        color="#fff"
                                    />
                                </Surface>
                            </View>

                            <Text style={styles.cardTitle}>Multi Run</Text>
                            <Text style={styles.cardDescription}>
                                Perfect for interval training with multiple
                                segments and custom rest periods.
                            </Text>

                            <Button
                                mode="contained"
                                onPress={handleMultiRun}
                                style={[
                                    styles.button,
                                    { backgroundColor: "#FF6B6B" },
                                ]}
                            >
                                Start Multi Run
                            </Button>
                        </Card.Content>
                    </Card>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Run
