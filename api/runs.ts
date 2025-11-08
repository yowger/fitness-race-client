import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useAuth } from "@/providers/AuthProvider"

// const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api"
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:4000/api"

export function getRunApi(token?: string) {
    return axios.create({
        baseURL: `${API_URL}/runs`,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })
}

export async function fetchRuns(token?: string) {
    const res = await getRunApi(token).get("/")
    return res.data
}

export function useRuns() {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["runs"],
        queryFn: () => fetchRuns(token),
    })
}

export async function fetchRunById(id: string, token?: string) {
    const res = await getRunApi(token).get(`/${id}`)
    return res.data
}

export function useRun(id?: string) {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["run", id],
        queryFn: () => fetchRunById(id!, token),
        enabled: !!id,
    })
}

export interface CreateRunInput {
    name: string
    distance: number
    time: number
    pace: string
    route: { latitude: number; longitude: number }[]
    map_image?: string
    start_address?: string
    end_address?: string
}

export async function createRun(data: CreateRunInput, token?: string) {
    const res = await getRunApi(token).post("/", data)
    return res.data
}

export function useCreateRun() {
    const { session } = useAuth()
    const token = session?.access_token
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateRunInput) => createRun(data, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["runs"] })
        },
    })
}

export async function deleteRun(id: string, token?: string) {
    const res = await getRunApi(token).delete(`/${id}`)
    return res.data
}

export function useDeleteRun() {
    const { session } = useAuth()
    const token = session?.access_token
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteRun(id, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["runs"] })
        },
    })
}

export async function fetchHealth(token?: string) {
    const res = await getRunApi(token).get("/health")
    return res.data
}

export function useHealth() {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["health"],
        queryFn: () => fetchHealth(token),
        staleTime: 5 * 1000,
        refetchOnWindowFocus: false,
    })
}
