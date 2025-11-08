import React, { useState } from "react"
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Image,
    TextInput,
    Alert,
} from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { Button, Surface } from "react-native-paper"
import { useReverseGeocode } from "@/api/geoapify"
import { useCreateRun, useHealth } from "@/api/runs"

export default function RunSummary() {
    const { mutate: saveRun, isPending, error } = useCreateRun()
    console.log("🚀 ~ RunSummary ~ error:", error?.message)

    const { summary } = useLocalSearchParams()
    const data = summary ? JSON.parse(summary as string) : null
    const [name, setName] = useState(
        `Run on ${new Date().toLocaleDateString()}`
    )

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

    const handleSave = () => {
        const finalName =
            name.trim() || `Run on ${new Date().toLocaleDateString()}`
        
        saveRun(
            {
                name: finalName,
                distance: data.distance,
                time: data.time,
                pace: data.pace,
                route: data.route,
                map_image: data.mapImage,
                start_address: startLabel,
                end_address: endLabel,
            },
            {
                onSuccess: () => {
                    Alert.alert("Run Saved", `"${finalName}" has been saved.`)
                    router.push("/run/single")
                },
                onError: (err: any) => {
                    console.log("🚀 ~ handleSave ~ err:", err)
                    Alert.alert("Error saving run", err.message)
                },
            }
        )
    }

    const handleDiscard = () => {
        Alert.alert(
            "Discard Run?",
            "This run will be deleted and cannot be recovered.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Discard",
                    style: "destructive",
                    onPress: () => router.push("/run/single"),
                },
            ]
        )
    }

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

            <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter run name"
                placeholderTextColor="#888"
                style={styles.nameInput}
            />

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

            <View style={styles.buttonRow}>
                <Button
                    mode="outlined"
                    style={styles.discardBtn}
                    textColor="#ff5252"
                    onPress={handleDiscard}
                >
                    Discard
                </Button>
                <Button
                    mode="contained"
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={isPending}
                    loading={isPending}
                >
                    {isPending ? "Saving..." : "Save Run"}
                </Button>
            </View>
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
    nameInput: {
        backgroundColor: "#1c1c1c",
        color: "#fff",
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
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
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: "#00c853",
        marginLeft: 10,
    },
    discardBtn: {
        flex: 1,
        borderColor: "#ff5252",
        marginRight: 10,
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
