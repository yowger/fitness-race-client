import { useEffect } from "react"
import { router } from "expo-router"
import { useAuth } from "../providers/AuthProvider"

export default function Index() {
    const { session, isLoading } = useAuth()

    useEffect(() => {
        if (isLoading) return

        if (session) router.replace("/(tabs)/home")
        else router.replace("/(auth)/login")
    }, [session, isLoading])

    return null
}
