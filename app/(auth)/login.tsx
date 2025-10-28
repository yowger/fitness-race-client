import React, { useState } from "react"
import { TextInput, Button } from "react-native-paper"
import { Alert, StyleSheet, View, AppState } from "react-native"

import { supabase } from "../../lib/supabase"

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

        if (error) Alert.alert(error.message)
        setLoading(false)
    }

    async function signUpWithEmail() {
        setLoading(true)
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) Alert.alert(error.message)
        if (!session)
            Alert.alert("Please check your inbox for email verification!")
        setLoading(false)
    }

    return (
        <View style={styles.container}>
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
                style={styles.button}
            >
                Sign In
            </Button>

            <Button
                mode="outlined"
                loading={loading}
                onPress={signUpWithEmail}
                style={styles.button}
            >
                Sign Up
            </Button>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        padding: 16,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 12,
    },
})
