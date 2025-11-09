import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useAuth } from "@/providers/AuthProvider"

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:4000/api"

export function getUserApi(token?: string) {
    return axios.create({
        baseURL: `${API_URL}/users`,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })
}

export interface CreateUserInput {
    id: string
    email: string
    fullName: string
    username?: string
    avatar_url?: string
}

export async function createUser(data: CreateUserInput, token?: string) {
    const res = await getUserApi(token).post("/", data)
    return res.data
}

export function useCreateUser() {
    const { session } = useAuth()
    const token = session?.access_token
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateUserInput) => createUser(data, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
        },
    })
}
