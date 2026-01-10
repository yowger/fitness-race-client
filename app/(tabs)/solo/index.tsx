import { StyleSheet, Text, View, TouchableOpacity } from "react-native"
import React from "react"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

export default function SoloTab() {
    const router = useRouter()

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
                    <Text style={styles.footerTitle}>Last Run</Text>
                    <Text style={styles.footerText}>No runs yet</Text>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#0F172A", // dark, sporty
    },
    container: {
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 40,
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
        alignItems: "center",
    },
    footerTitle: {
        fontSize: 14,
        color: "#94A3B8",
    },
    footerText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#E5E7EB",
        marginTop: 4,
    },
})
