import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
} from "react-native"
import React from "react"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRuns, Run } from "@/api/runs"

export default function SoloTab() {
    const { data: runs, isLoading } = useRuns()
    const router = useRouter()

    // Show only the last 3 runs
    const lastRuns = runs?.slice(0, 3) ?? []

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Solo Run</Text>
                    <Text style={styles.subtitle}>Ready when you are</Text>
                </View>

                <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => router.push("/run/single/live")}
                    activeOpacity={0.85}
                >
                    <Text style={styles.startText}>START</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerTitle}>Recent Runs</Text>

                    {isLoading ? (
                        <Text style={styles.footerText}>Loading...</Text>
                    ) : lastRuns.length === 0 ? (
                        <Text style={styles.footerText}>No runs yet</Text>
                    ) : (
                        <FlatList
                            data={lastRuns}
                            keyExtractor={(item: Run) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.runItem}>
                                    <Text style={styles.runName}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.runStats}>
                                        {item.distance.toFixed(2)} km •{" "}
                                        {item.time} sec • {item.pace}
                                    </Text>
                                </View>
                            )}
                        />
                    )}
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#0F172A",
    },
    container: {
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 40,
        width: "100%",
    },
    header: {
        alignItems: "center",
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    subtitle: {
        marginTop: 6,
        fontSize: 16,
        color: "#94A3B8",
    },

    startButton: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "#22C55E",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#22C55E",
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
    startText: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: 2,
    },

    footer: {
        width: "90%",
        alignItems: "flex-start",
    },
    footerTitle: {
        fontSize: 14,
        color: "#94A3B8",
        marginBottom: 8,
    },
    footerText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#E5E7EB",
        marginTop: 4,
    },
    runItem: {
        marginBottom: 6,
    },
    runName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFF",
    },
    runStats: {
        fontSize: 14,
        color: "#94A3B8",
    },
})
