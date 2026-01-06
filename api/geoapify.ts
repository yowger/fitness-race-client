import { useQuery } from "@tanstack/react-query"
import axios from "axios"

// const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY
const GEOAPIFY_API_KEY = "0ce4d4da2be740279d25b88593bf38dd"

export const geoapifyApi = axios.create({
    baseURL: "https://api.geoapify.com/v1",
    params: {
        apiKey: GEOAPIFY_API_KEY,
    },
})

export async function fetchAddress(lat: number, lon: number) {
    const res = await geoapifyApi.get("/geocode/reverse", {
        params: { lat, lon },
    })
    return res.data
}

export function useReverseGeocode(lat?: number, lon?: number) {
    return useQuery({
        queryKey: ["reverseGeocode", lat, lon],
        queryFn: () => fetchAddress(lat!, lon!),
        enabled: !!lat && !!lon,
    })
}
