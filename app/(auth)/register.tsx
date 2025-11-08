import React, { useState } from "react"
import { StyleSheet, View, Alert } from "react-native"
import { TextInput, Button } from "react-native-paper"
import { supabase } from "../../lib/supabase"
import { useCreateUser } from "@/api/user"

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
        <View style={styles.container}>
            <TextInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                mode="outlined"
                style={styles.input}
            />
            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                mode="outlined"
                style={styles.input}
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
            />

            <Button
                mode="contained"
                loading={loading}
                onPress={handleRegister}
                style={styles.button}
            >
                Register
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
