import { View, Text } from "react-native"
import { useLocalSearchParams } from "expo-router"

export default function RouteDetail() {
    const { id } = useLocalSearchParams<{ id: string }>()

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 24 }}>Route ID: {id}</Text>
        </View>
    )
}
