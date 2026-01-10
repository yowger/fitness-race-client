import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/providers/AuthProvider"
import { runApi } from "@/lib/axios"

export interface RunPoint {
    latitude: number
    longitude: number
}

export interface RouteInfo {
    id: string
    name: string
    distance?: number
    geojson?: any
}

export interface Run {
    id: string
    name: string
    distance: number
    time: number
    pace: string
    route: RunPoint[]
    map_image?: string
    start_address?: string
    end_address?: string
    route_id?: string
    created_by?: string
    created_at: string
    routes?: RouteInfo // joined route info
}

// old one
export async function fetchRuns(token?: string) {
    const res = await runApi(token).get("/runs")
    return res.data as Run[]
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
    const res = await runApi(token).get(`/${id}`)
    return res.data as Run
}

export function useRun(id?: string) {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["runs", id],
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
    route_id?: string
    map_image?: string
    start_address?: string
    end_address?: string
}

export async function createRun(data: CreateRunInput, token?: string) {
    const res = await runApi(token).post("/runs", data)
    return res.data as Run
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
    const res = await runApi(token).delete(`/${id}`)
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
    const res = await runApi(token).get("/health")
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
