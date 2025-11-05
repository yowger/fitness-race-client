import React from "react"
import { StyleSheet, View, Text, ScrollView, Image } from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { Button, Surface } from "react-native-paper"
import { useReverseGeocode } from "@/app/api/geoapify"

export default function RunSummary() {
    const { summary } = useLocalSearchParams()
    const data = summary ? JSON.parse(summary as string) : null

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
                <Text style={styles.errorText}>No run data available</Text>
                <Button mode="contained" onPress={() => router.back()}>
                    Go Back
                </Button>
            </View>
        )
    }

    const startLabel =
        startAddress?.features?.[0]?.properties?.formatted || "Loading start..."
    const endLabel =
        endAddress?.features?.[0]?.properties?.formatted || "Loading end..."

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Run Summary</Text>

            {data.mapImage && (
                <Image
                    source={{ uri: data.mapImage }}
                    style={styles.mapImage}
                    resizeMode="cover"
                />
            )}

            <Surface style={styles.card}>
                <View style={styles.statRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                            {data.distance?.toFixed(2)} km
                        </Text>
                        <Text style={styles.statLabel}>Distance</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                            {data.time ? formatTime(data.time) : "0:00"}
                        </Text>
                        <Text style={styles.statLabel}>Time</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{data.pace}</Text>
                        <Text style={styles.statLabel}>Pace</Text>
                    </View>
                </View>
            </Surface>

            <Surface style={styles.routeCard}>
                <Text style={styles.sectionTitle}>Route</Text>

                <View style={styles.routeItem}>
                    <Text style={styles.routeLabel}>Start:</Text>
                    <Text style={styles.routeValue}>
                        {startLoading ? "..." : startLabel}
                    </Text>
                </View>

                <View style={styles.routeItem}>
                    <Text style={styles.routeLabel}>End:</Text>
                    <Text style={styles.routeValue}>
                        {endLoading ? "..." : endLabel}
                    </Text>
                </View>
            </Surface>

            <Button
                mode="contained"
                style={styles.doneBtn}
                onPress={() => router.push("/run/single")}
            >
                Done
            </Button>
        </ScrollView>
    )
}

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#111",
        padding: 20,
        paddingTop: 40,
    },
    title: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    mapImage: {
        width: "100%",
        height: 220,
        borderRadius: 16,
        marginBottom: 20,
    },
    card: {
        backgroundColor: "#1c1c1c",
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    statRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statBox: {
        alignItems: "center",
        flex: 1,
    },
    statValue: {
        color: "#00c853",
        fontSize: 24,
        fontWeight: "bold",
    },
    statLabel: {
        color: "#aaa",
        fontSize: 14,
        marginTop: 4,
    },
    routeCard: {
        backgroundColor: "#1c1c1c",
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    routeItem: {
        marginBottom: 8,
    },
    routeLabel: {
        color: "#aaa",
        fontSize: 14,
    },
    routeValue: {
        color: "#fff",
        fontSize: 14,
        marginLeft: 8,
    },
    doneBtn: {
        marginTop: 10,
        backgroundColor: "#00c853",
        paddingVertical: 10,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111",
    },
    errorText: {
        color: "#fff",
        marginBottom: 10,
    },
})
