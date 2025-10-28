import { StyleSheet } from "react-native"

export const styles = StyleSheet.create({
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 30,
        marginTop: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#1a1a1a",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
    },
    cardsContainer: {
        gap: 20,
    },
    card: {
        borderRadius: 16,
        backgroundColor: "#fff",
    },
    cardContent: {
        padding: 20,
    },
    iconContainer: {
        alignItems: "center",
        marginBottom: 16,
    },
    iconSurface: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 12,
    },
    cardDescription: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20,
    },
    button: {
        borderRadius: 12,
        paddingVertical: 6,
    },
})
