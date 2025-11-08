import React, { useState } from "react"
import { StyleSheet, View, Alert, Text, Animated } from "react-native"
import { TextInput, Button } from "react-native-paper"
import { supabase } from "../../lib/supabase"
import { useCreateUser } from "@/api/user"
import { LinearGradient } from "expo-linear-gradient"
import MaterialIcons from "@react-native-vector-icons/material-icons"

export default function Register() {
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const createUserMutation = useCreateUser()

    async function handleRegister() {
        if (!fullName || !email || !password) {
            Alert.alert("Please fill all fields")
            return
        }

        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            })

            if (error) {
                Alert.alert("Signup Error", error.message)
                setLoading(false)
                return
            }

            if (!data.user) {
                Alert.alert("Please check your inbox for email verification!")
                setLoading(false)
                return
            }

            await createUserMutation.mutateAsync({
                id: data.user.id,
                email: data.user.email!,
                fullName,
            })

            Alert.alert("User created successfully!")
            setFullName("")
            setEmail("")
            setPassword("")
        } catch (err: any) {
            Alert.alert("Failed to create user", err.message)
        }

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
                    label="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    mode="outlined"
                    left={<TextInput.Icon icon="account" />}
                    style={styles.input}
                />
                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
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
                    onPress={handleRegister}
                    style={styles.registerButton}
                >
                    Register
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
    registerButton: { borderRadius: 12 },
    footer: {
        textAlign: "center",
        color: "rgba(255,255,255,0.8)",
        marginTop: 24,
    },
})
