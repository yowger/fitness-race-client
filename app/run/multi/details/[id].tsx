import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from "react-native"
import React from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useRace, useJoinRace, useLeaveRace } from "@/api/races"
import { useAuth } from "@/providers/AuthProvider"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Location from "expo-location"

export async function canAccessLiveRace() {
    const fg = await Location.getForegroundPermissionsAsync()

    if (fg.status === "granted") return true

    const req = await Location.requestForegroundPermissionsAsync()
    return req.status === "granted"
}

const DetailsScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const { session } = useAuth()
    const userId = session?.user.id

    const { data: race, isLoading, isError } = useRace(id!)
    const joinMutation = useJoinRace()
    const leaveMutation = useLeaveRace()

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Loading race...</Text>
            </View>
        )
    }

    if (isError || !race) {
        return (
            <View style={styles.center}>
                <Text>Failed to load race.</Text>
            </View>
        )
    }

    const isJoined = race.participants?.some((p) => p.user?.id === userId)

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>

                {isJoined ? <Text>Joined</Text> : <Text>Not joined</Text>}

                <Text style={styles.title}>{race.name}</Text>

                <Text style={styles.status}>
                    Status:{" "}
                    {race.status.charAt(0).toUpperCase() + race.status.slice(1)}
                </Text>

                <Text style={styles.label}>Start:</Text>
                <Text style={styles.value}>
                    {new Date(race.start_time).toLocaleString()}
                </Text>

                {race.end_time && (
                    <>
                        <Text style={styles.label}>End:</Text>
                        <Text style={styles.value}>
                            {new Date(race.end_time).toLocaleString()}
                        </Text>
                    </>
                )}

                {race.routes && (
                    <>
                        <Text style={styles.label}>Distance:</Text>
                        <Text style={styles.value}>
                            {race.routes.distance?.toFixed(2)} km
                        </Text>
                    </>
                )}

                <Text style={styles.label}>Participants:</Text>
                <Text style={styles.value}>
                    {race.participants?.length || 0}/
                    {race.max_participants ?? "∞"}
                </Text>

                <TouchableOpacity
                    style={[
                        styles.button,
                        isJoined ? styles.leaveBtn : styles.joinBtn,
                    ]}
                    disabled={joinMutation.isPending || leaveMutation.isPending}
                    onPress={() => {
                        if (isJoined) {
                            leaveMutation.mutate({
                                race_id: race.id,
                                user_id: userId!,
                            })
                        } else {
                            joinMutation.mutate({
                                race_id: race.id,
                                user_id: userId!,
                            })
                        }
                    }}
                >
                    <Text style={styles.buttonText}>
                        {isJoined ? "Leave Race" : "Join Race"}
                    </Text>
                </TouchableOpacity>

                {isJoined && (
                    <TouchableOpacity
                        style={[styles.button, styles.liveBtn]}
                        onPress={async () => {
                            const ok = await canAccessLiveRace()

                            if (!ok) {
                                Alert.alert(
                                    "Location Required",
                                    "Enable location access to join the live race."
                                )
                                return
                            }

                            router.push({
                                pathname: `/run/multi/live/[id]`,
                                params: { id },
                            })
                        }}
                    >
                        <Text style={styles.buttonText}>Go to Live Race</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    )
}

export default DetailsScreen

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    container: {
        flex: 1,
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    backButton: {
        fontSize: 16,
        marginBottom: 20,
        color: "#007AFF",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
    },
    status: {
        fontSize: 16,
        color: "#444",
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: "#777",
        marginTop: 10,
    },
    value: {
        fontSize: 16,
        fontWeight: "500",
    },
    button: {
        marginTop: 30,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    joinBtn: {
        backgroundColor: "#28a745",
    },
    leaveBtn: {
        backgroundColor: "#dc3545",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    liveBtn: {
        backgroundColor: "#1E90FF",
        marginTop: 15,
    },
})
