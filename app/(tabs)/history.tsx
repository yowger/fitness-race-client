import { StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const History = () => {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text>History</Text>
            </View>
        </SafeAreaView>
    )
}

export default History

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 20,
    },
})
