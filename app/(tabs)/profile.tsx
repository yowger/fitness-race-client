import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "react-native-paper"

import { useAuth } from "../../providers/AuthProvider"
import { supabase } from "../../lib/supabase"

export default function Profile() {
    const { session } = useAuth()

    const user = session?.user

    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.header}>Profile</Text>

                {user ? (
                    <>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{user.email}</Text>

                        <Text style={styles.label}>User ID:</Text>
                        <Text style={styles.value}>{user.id}</Text>

                        {user.user_metadata.full_name && (
                            <>
                                <Text style={styles.label}>Full Name:</Text>
                                <Text style={styles.value}>
                                    {user.user_metadata.full_name}
                                </Text>
                            </>
                        )}

                        <Button
                            mode="contained"
                            onPress={handleSignOut}
                            style={styles.logoutBtn}
                        >
                            Logout
                        </Button>
                    </>
                ) : (
                    <Text>No user data found</Text>
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 20,
    },
    label: { fontWeight: "bold" },
    value: { marginBottom: 12 },
    logoutBtn: { marginTop: 20 },
})
