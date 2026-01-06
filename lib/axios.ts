import axios from "axios"

// const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api"
// const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:4000/api"
const API_URL = "https://fitness-race-api.onrender.com"

export function runApi(token?: string) {
    return axios.create({
        baseURL: `${API_URL}/`,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })
}
