import {
    useQuery,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query"
import { runApi } from "@/lib/axios"
import { useAuth } from "@/providers/AuthProvider"

export interface UserInfo {
    id: string
    email?: string
    full_name?: string
    avatar_url?: string
}

export interface Participant {
    id: string
    race_id: string
    user_id: string
    bib_number?: number
    joined_at?: string
    user?: UserInfo
}

export interface Tracking {
    id: string
    race_id: string
    user_id: string
    latitude: number
    longitude: number
    recorded_at: string
}

export interface Result {
    id: string
    race_id: string
    user_id: string
    finish_time: string
    position?: number
    recorded_at: string
    user?: UserInfo
}

export interface Race {
    id: string
    name: string
    description?: string
    start_time: string
    end_time?: string
    max_participants?: number
    route_id?: string
    created_by?: string
    status: string
    created_at?: string
    updated_at?: string
    routes?: any
    participants?: Participant[]
    created_by_user: UserInfo
}

export interface RaceFilters {
    userId?: string
    createdBy?: string
    name?: string
    status?: "upcoming" | "ongoing" | "finished"
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
}

export const useRacesSimple = (filters?: RaceFilters) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["races", filters],
        queryFn: () =>
            getAllRaces({ pageParam: 0, limit: 100, filters, token }),
        staleTime: 1000 * 60 * 5,
    })
}

export const getAllRaces = async ({
    pageParam = 0,
    limit = 20,
    filters,
    token,
}: {
    pageParam?: number
    limit?: number
    filters?: RaceFilters
    token?: string
}) => {
    const res = await runApi(token).get("/group-races", {
        params: {
            ...filters,
            limit,
            offset: pageParam * limit,
        },
    })
    return res.data as Race[]
}

export const getRaceById = async (id: string, token?: string) => {
    const res = await runApi(token).get(`/group-races/${id}`)
    return res.data as Race
}

export const createRace = async (data: Partial<Race>, token?: string) => {
    const res = await runApi(token).post("/group-races", data)
    return res.data as Race
}

export const addParticipant = async (
    data: { race_id: string; user_id: string },
    token?: string
) => {
    const res = await runApi(token).post("/group-races/participants", data)
    return res.data as Participant
}

export const removeParticipant = async (
    data: { race_id: string; user_id: string },
    token?: string
) => {
    const res = await runApi(token).delete("/group-races/participants", {
        data,
    })
    return res.data as Participant
}

export const getParticipantsByRace = async (raceId: string, token?: string) => {
    const res = await runApi(token).get(`/group-races/${raceId}/participants`)
    return res.data as Participant[]
}

export const getTrackingByRace = async (
    raceId: string,
    token?: string,
    userId?: string
) => {
    const res = await runApi(token).get(`/group-races/${raceId}/tracking`, {
        params: { userId },
    })
    return res.data as Tracking[]
}

export const addTracking = async (
    data: Omit<Tracking, "id">,
    token?: string
) => {
    const res = await runApi(token).post("/group-races/tracking", data)
    return res.data as Tracking
}

export const getLatestTracking = async (
    raceId: string,
    userId: string,
    token?: string
) => {
    const res = await runApi(token).get(
        `/group-races/${raceId}/tracking/latest/${userId}`
    )
    return res.data as Tracking
}

export const getResultsByRace = async (raceId: string, token?: string) => {
    const res = await runApi(token).get(`/group-races/${raceId}/results`)
    return res.data as Result[]
}

export const addResult = async (data: Omit<Result, "id">, token?: string) => {
    const res = await runApi(token).post("/group-races/results", data)
    return res.data as Result
}

export const useRaces = (filters?: RaceFilters, limit = 20) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useInfiniteQuery({
        queryKey: ["races", filters],
        queryFn: ({ pageParam = 0 }) =>
            getAllRaces({ pageParam, limit, filters, token }),
        getNextPageParam: (lastPage, allPages) =>
            lastPage.length < limit ? undefined : allPages.length,
        initialPageParam: 0,
        staleTime: 1000 * 60 * 5,
    })
}

export const useRace = (id: string) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery<Race>({
        queryKey: ["race", id],
        queryFn: () => getRaceById(id, token),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    })
}

export const useCreateRace = () => {
    const { session } = useAuth()
    const token = session?.access_token
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (data: Partial<Race>) => createRace(data, token),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["races"] }),
    })
}

export const useJoinRace = () => {
    const { session } = useAuth()
    const token = session?.access_token
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (data: { race_id: string; user_id: string }) =>
            addParticipant(data, token),
        onSuccess: (_, data) =>
            qc.invalidateQueries({ queryKey: ["race", data.race_id] }),
    })
}

export const useLeaveRace = () => {
    const { session } = useAuth()
    const token = session?.access_token
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (data: { race_id: string; user_id: string }) =>
            removeParticipant(data, token),
        onSuccess: (_, data) =>
            qc.invalidateQueries({ queryKey: ["race", data.race_id] }),
    })
}
