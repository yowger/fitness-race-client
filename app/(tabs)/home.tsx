import { StyleSheet, Text, View } from "react-native"
import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"

const Home = () => {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text>Home</Text>
            </View>
        </SafeAreaView>
    )
}

export default Home

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 20,
    },
})
