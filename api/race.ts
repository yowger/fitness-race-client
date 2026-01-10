import {
    useQuery,
    useMutation,
    useQueryClient,
    useInfiniteQuery,
} from "@tanstack/react-query"
import { runApi } from "@/lib/axios"
import { useAuth } from "@/providers/AuthProvider"

export type Position = [number, number]

export interface LineString {
    type: "LineString"
    coordinates: Position[]
}

export interface Feature<T = LineString> {
    type: "Feature"
    geometry: T
    properties?: Record<string, unknown>
}

export interface FeatureCollection<T = LineString> {
    type: "FeatureCollection"
    features: Feature<T>[]
}

export interface UserInfo {
    id: string
    email?: string
    full_name?: string
    avatar_url?: string
}

export interface RouteResponse {
    id: string
    name: string
    description?: string
    distance?: number
    geojson: FeatureCollection<LineString>
    start_address?: string
    end_address?: string
    map_url?: string
    created_by?: string
    created_at?: string
    users?: UserInfo
}

export interface CreateRouteInput {
    name: string
    description?: string
    distance?: number
    geojson: FeatureCollection<LineString>
    map_url?: string
}

export const getAllRoutes = async ({
    pageParam = 1,
    limit = 20,
    token,
}: { pageParam?: number; limit?: number; token?: string } = {}) => {
    const res = await runApi(token).get("/routes", {
        params: { page: pageParam, limit },
    })
    return res.data as RouteResponse[]
}

export const getRouteById = async (id: string, token?: string) => {
    const res = await runApi(token).get(`/routes/${id}`)
    return res.data as RouteResponse
}

export const createRoute = async (input: CreateRouteInput, token?: string) => {
    const res = await runApi(token).post("/routes", input)
    return res.data as RouteResponse
}

export const deleteRoute = async (id: string, token?: string) => {
    await runApi(token).delete(`/routes/${id}`)
}

export const useRoutes = (limit = 20) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useInfiniteQuery({
        queryKey: ["routes"],
        queryFn: ({ pageParam = 1 }) =>
            getAllRoutes({ pageParam, limit, token }),
        getNextPageParam: (lastPage, allPages) =>
            lastPage.length < limit ? undefined : allPages.length + 1,
        initialPageParam: 1,
        staleTime: 1000 * 60 * 5,
    })
}

export const useRoute = (id: string) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery<RouteResponse>({
        queryKey: ["route", id],
        queryFn: () => getRouteById(id!, token),
        staleTime: 1000 * 60 * 5,
        enabled: !!id,
    })
}

export const useCreateRoute = () => {
    const { session } = useAuth()
    const token = session?.access_token
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateRouteInput) => createRoute(data, token),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["routes"] }),
    })
}

export const useDeleteRoute = () => {
    const { session } = useAuth()
    const token = session?.access_token
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteRoute(id, token),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["routes"] }),
    })
}
