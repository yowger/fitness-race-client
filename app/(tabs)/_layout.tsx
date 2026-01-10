import { MaterialIcons } from "@react-native-vector-icons/material-icons"
import { Tabs } from "expo-router"
import { useTheme } from "react-native-paper"

export default function TabsLayout() {
    const theme = useTheme()

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: "#8e8e93",
            }}
        >
            <Tabs.Screen
                name="home/index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ size, color }) => (
                        <MaterialIcons name="home" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="races/index"
                options={{
                    title: "Races",
                    tabBarIcon: ({ size, color }) => (
                        <MaterialIcons
                            name="emoji-events"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="solo/index"
                options={{
                    title: "Solo",
                    tabBarIcon: ({ size, color }) => (
                        <MaterialIcons
                            name="directions-run"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile/index"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ size, color }) => (
                        <MaterialIcons
                            name="person"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    )
}
