import React, { useState } from "react"
import { StyleSheet, View, Alert, Animated, AppState, Text } from "react-native"
import { TextInput, Button } from "react-native-paper"
import { supabase } from "../../lib/supabase"
import { router } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import MaterialIcons from "@react-native-vector-icons/material-icons"

AppState.addEventListener("change", (state) => {
    if (state === "active") {
        supabase.auth.startAutoRefresh()
    } else {
        supabase.auth.stopAutoRefresh()
    }
})

export default function Auth() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    async function signInWithEmail() {
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) Alert.alert("Login Error", error.message)
        setLoading(false)
    }

    return (
        <LinearGradient
            colors={["#f97316", "#ef4444", "#ec4899"]}
            style={styles.container}
        >
            <View style={styles.bgContainer}>
                <Animated.View
                    style={[
                        styles.circle,
                        { top: 100, left: 40, opacity: 0.1 },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.circle,
                        { bottom: 100, right: 40, opacity: 0.1 },
                    ]}
                />
            </View>

            <View style={styles.topHeader}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logo}>
                        <MaterialIcons
                            name={"run-circle"}
                            size={75}
                            color="#f97316"
                        />
                    </Text>
                </View>
                <Text style={styles.appName}>RunTrack</Text>
                <Text style={styles.subtitle}>
                    Track your journey, one step at a time
                </Text>
            </View>

            <View style={styles.card}>
                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    mode="outlined"
                    left={<TextInput.Icon icon="email" />}
                    style={styles.input}
                />
                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    mode="outlined"
                    left={<TextInput.Icon icon="lock" />}
                    style={styles.input}
                />

                <Button
                    mode="contained"
                    loading={loading}
                    onPress={signInWithEmail}
                    style={styles.signInButton}
                >
                    Sign In
                </Button>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                <Button
                    mode="outlined"
                    onPress={() => router.push("/register")}
                    style={styles.registerButton}
                >
                    Create New Account
                </Button>
            </View>

            <Text style={styles.footer}>
                By continuing, you agree to our Terms & Privacy Policy
            </Text>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    bgContainer: { ...StyleSheet.absoluteFillObject },
    circle: {
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "#fff",
    },

    topHeader: { alignItems: "center", marginTop: 80, marginBottom: 24 },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    logo: { fontSize: 36 },
    appName: { fontSize: 32, fontWeight: "bold", color: "#fff" },
    subtitle: { fontSize: 14, color: "#fff" },

    card: {
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 30,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },

    input: { marginBottom: 16 },
    signInButton: { borderRadius: 12 },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 16,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: "#ccc" },
    dividerText: { marginHorizontal: 8, color: "#888" },
    registerButton: { borderRadius: 12 },
    footer: {
        textAlign: "center",
        color: "rgba(255,255,255,0.8)",
        marginTop: 24,
    },
})
