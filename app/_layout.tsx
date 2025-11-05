import { Stack } from "expo-router"
import React from "react"
import { DefaultTheme, PaperProvider } from "react-native-paper"

import { AuthProvider } from "../providers/AuthProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: "#f57c00",
        secondary: "#1c1c1e",
        tertiary: "#00e676",
    },
}

const queryClient = new QueryClient()

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <PaperProvider theme={theme}>
                    <Stack screenOptions={{ headerShown: false }} />
                </PaperProvider>
            </AuthProvider>
        </QueryClientProvider>
    )
}
