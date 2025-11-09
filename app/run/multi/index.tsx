import React, { useState } from "react"
import { View, Text, TextInput, Button } from "react-native"

import { router } from "expo-router"
import { initSocket } from "@/lib/socket"
import { useAuth } from "@/providers/AuthProvider"

const index = () => {
    const { session } = useAuth()
    const userId = session?.user.id
    const [roomId, setRoomId] = useState("")

    const handleJoin = () => {
        if (!userId) return

        const socket = initSocket(userId)
        socket.emit("joinRoom", roomId)
        router.push({ pathname: "/run/multi/active", params: { roomId } })
    }

    return (
        <View style={{ padding: 16 }}>
            <Text>Enter Room ID:</Text>
            <TextInput
                value={roomId}
                onChangeText={setRoomId}
                style={{ borderWidth: 1, marginVertical: 12, padding: 8 }}
            />
            <Button title="Join Race" onPress={handleJoin} />
        </View>
    )
}

export default index
