import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/providers/AuthProvider"
import { runApi } from "@/lib/axios"

export async function fetchRuns(token?: string) {
    const res = await runApi(token).get("/")
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
    const res = await runApi(token).get(`/${id}`)
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
    const res = await runApi(token).post("/", data)
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
