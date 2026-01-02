import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
    bib_number?: number
    id: string
    race_id: string
    user_id: string
    users: {
        full_name: string
    }
    latitude: number
    longitude: number
    recorded_at: string
}

export type RaceResultStatus =
    | "Finished"
    | "DNF"
    | "DNS"
    | "Disqualified"
    | "Did Not Join"

export interface RaceResult {
    id: string
    bib_number?: number
    users: {
        id: string
        full_name: string
        email: string
    }
    race_id: string
    user_id: string
    finish_time: number
    position?: number
    recorded_at: string
    user?: UserInfo
    status: "Finished" | "Did Not Join" | "Disqualified" | "DNS" | "DNF"
}

export interface Race {
    id: string
    name: string
    description?: string
    price?: number
    start_time: string
    end_time?: string
    actual_start_time?: string
    actual_end_time?: string
    max_participants?: number
    banner_url?: string
    route_id?: string
    created_by?: string
    status: string
    created_at?: string
    updated_at?: string
    routes?: RouteResponse
    participants?: Participant[]
    created_by_user: UserInfo
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

/*
    Finished	Racer completed the race normally.
    Did Not Join	Racer was registered but did not start.
    Disqualified	Racer broke rules / cheated / invalid attempt.
    DNS (Did Not Start)	Similar to Did Not Join, optional shorthand.
    DNF (Did Not Finish)	Started but did not complete the race.
*/

export interface RaceFilters {
    userId?: string
    createdBy?: string
    name?: string
    status?: "upcoming" | "ongoing" | "finished" | "complete"
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
}

const api = (token?: string) => runApi(token)

export const getAllRaces = async (
    filters?: RaceFilters,
    token?: string
): Promise<Race[]> => {
    const res = await api(token).get("/group-races", { params: filters })
    return res.data
}

export const getRaceById = async (
    id: string,
    token?: string
): Promise<Race> => {
    const res = await api(token).get(`/group-races/${id}`)
    return res.data
}

export const startRace = async (id: string, token?: string) => {
    const res = await api(token).post(`/group-races/${id}/start`)
    return res.data as Race
}

export const endRace = async (id: string, token?: string) => {
    const res = await api(token).post(`/group-races/${id}/end`)
    return res.data as Race
}

export const getParticipantsByRace = async (raceId: string, token?: string) => {
    const res = await api(token).get(`/group-races/${raceId}/participants`)
    return res.data as Participant[]
}

export const updateParticipantBib = async (
    input: { race_id: string; user_id: string; bib_number: number },
    token?: string
) => {
    const res = await api(token).patch("/group-races/participants/bib", input)
    return res.data
}

export const addTracking = async (
    input: Omit<Tracking, "id">,
    token?: string
) => {
    const res = await api(token).post("/group-races/tracking", input)
    return res.data as Tracking
}

export const getTrackingByRace = async (
    raceId: string,
    token?: string,
    userId?: string
) => {
    const res = await api(token).get(`/group-races/${raceId}/tracking`, {
        params: { userId },
    })
    return res.data as Tracking[]
}

export const getLatestTracking = async (
    raceId: string,
    userId: string,
    token?: string
) => {
    const res = await api(token).get(
        `/group-races/${raceId}/tracking/latest/${userId}`
    )
    return res.data as Tracking
}

export const getResultsByRace = async (raceId: string, token?: string) => {
    const res = await api(token).get(`/group-races/${raceId}/results`)
    return res.data as RaceResult[]
}

export interface PublishResultItem {
    user_id: string
    position?: number | null
    status?: RaceResultStatus
    finish_time?: number | null
}

export const publishRaceResults = async (
    payload: { race_id: string; results: PublishResultItem[] },
    token?: string
) => {
    const res = await api(token).post("/group-races/results/publish", payload)
    return res.data
}

export const getRunnerProfileStats = async (userId: string, token?: string) => {
    const res = await api(token).get("/group-races/runners/stats", {
        params: { userId },
    })
    return res.data as {
        totalRaces: number
        totalDistance: string
        totalTime: string
        averagePace: string
    }
}

export const useRaces = (filters?: RaceFilters) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["races", filters],
        queryFn: () => getAllRaces(filters, token),
        staleTime: 1000 * 60 * 5,
    })
}

export const useRace = (id: string) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["race", id],
        queryFn: () => getRaceById(id, token),
        enabled: !!id,
    })
}

export const useParticipants = (raceId: string) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["race-participants", raceId],
        queryFn: () => getParticipantsByRace(raceId, token),
        enabled: !!raceId,
    })
}

export const useStartRace = () => {
    const { session } = useAuth()
    const token = session?.access_token
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (raceId: string) => startRace(raceId, token),
        onSuccess: (_, raceId) =>
            qc.invalidateQueries({ queryKey: ["race", raceId] }),
    })
}

export const useEndRace = () => {
    const { session } = useAuth()
    const token = session?.access_token
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (raceId: string) => endRace(raceId, token),
        onSuccess: (_, raceId) =>
            qc.invalidateQueries({ queryKey: ["race", raceId] }),
    })
}

export const useResults = (raceId: string) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["race-results", raceId],
        queryFn: () => getResultsByRace(raceId, token),
        enabled: !!raceId,
    })
}

export const usePublishRaceResults = () => {
    const { session } = useAuth()
    const token = session?.access_token
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (payload: {
            race_id: string
            results: PublishResultItem[]
        }) => publishRaceResults(payload, token),
        onSuccess: (_, { race_id }) => {
            qc.invalidateQueries({ queryKey: ["race", race_id] })
            qc.invalidateQueries({ queryKey: ["race-results", race_id] })
            qc.invalidateQueries({ queryKey: ["race-participants", race_id] })
        },
    })
}

export const useRunnerProfileStats = (userId?: string) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["runner-profile-stats", userId],
        queryFn: () => getRunnerProfileStats(userId!, token),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
    })
}

//  --

// export interface UserInfo {
//     id: string
//     email?: string
//     full_name?: string
//     avatar_url?: string
// }

// export interface Participant {
//     id: string
//     race_id: string
//     user_id: string
//     bib_number?: number
//     joined_at?: string
//     user?: UserInfo
// }

// export interface Tracking {
//     id: string
//     race_id: string
//     user_id: string
//     latitude: number
//     longitude: number
//     recorded_at: string
// }

// export interface Result {
//     id: string
//     race_id: string
//     user_id: string
//     finish_time: string
//     position?: number
//     recorded_at: string
//     user?: UserInfo
// }

// export interface Race {
//     id: string
//     name: string
//     description?: string
//     start_time: string
//     end_time?: string
//     max_participants?: number
//     route_id?: string
//     created_by?: string
//     status: string
//     created_at?: string
//     updated_at?: string
//     routes?: any
//     participants?: Participant[]
//     created_by_user: UserInfo
// }

// export interface RaceFilters {
//     userId?: string
//     createdBy?: string
//     name?: string
//     status?: "upcoming" | "ongoing" | "finished"
//     startDate?: string
//     endDate?: string
//     limit?: number
//     offset?: number
// }

// export const useRacesSimple = (filters?: RaceFilters) => {
//     const { session } = useAuth()
//     const token = session?.access_token

//     return useQuery({
//         queryKey: ["races", filters],
//         queryFn: () =>
//             getAllRaces({ pageParam: 0, limit: 100, filters, token }),
//         staleTime: 1000 * 60 * 5,
//     })
// }

// export const getAllRaces = async ({
//     pageParam = 0,
//     limit = 20,
//     filters,
//     token,
// }: {
//     pageParam?: number
//     limit?: number
//     filters?: RaceFilters
//     token?: string
// }) => {
//     const res = await runApi(token).get("/group-races", {
//         params: {
//             ...filters,
//             limit,
//             offset: pageParam * limit,
//         },
//     })
//     return res.data as Race[]
// }

// export const getRaceById = async (id: string, token?: string) => {
//     const res = await runApi(token).get(`/group-races/${id}`)
//     return res.data as Race
// }

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

// export const getParticipantsByRace = async (raceId: string, token?: string) => {
//     const res = await runApi(token).get(`/group-races/${raceId}/participants`)
//     return res.data as Participant[]
// }

// export const getTrackingByRace = async (
//     raceId: string,
//     token?: string,
//     userId?: string
// ) => {
//     const res = await runApi(token).get(`/group-races/${raceId}/tracking`, {
//         params: { userId },
//     })
//     return res.data as Tracking[]
// }

// export const addTracking = async (
//     data: Omit<Tracking, "id">,
//     token?: string
// ) => {
//     const res = await runApi(token).post("/group-races/tracking", data)
//     return res.data as Tracking
// }

// export const getLatestTracking = async (
//     raceId: string,
//     userId: string,
//     token?: string
// ) => {
//     const res = await runApi(token).get(
//         `/group-races/${raceId}/tracking/latest/${userId}`
//     )
//     return res.data as Tracking
// }

// export const getResultsByRace = async (raceId: string, token?: string) => {
//     const res = await runApi(token).get(`/group-races/${raceId}/results`)
//     return res.data as Result[]
// }

// export const addResult = async (data: Omit<Result, "id">, token?: string) => {
//     const res = await runApi(token).post("/group-races/results", data)
//     return res.data as Result
// }

// export const useRaces = (filters?: RaceFilters, limit = 20) => {
//     const { session } = useAuth()
//     const token = session?.access_token

//     return useInfiniteQuery({
//         queryKey: ["races", filters],
//         queryFn: ({ pageParam = 0 }) =>
//             getAllRaces({ pageParam, limit, filters, token }),
//         getNextPageParam: (lastPage, allPages) =>
//             lastPage.length < limit ? undefined : allPages.length,
//         initialPageParam: 0,
//         staleTime: 1000 * 60 * 5,
//     })
// }

// export const useRace = (id: string) => {
//     const { session } = useAuth()
//     const token = session?.access_token

//     return useQuery<Race>({
//         queryKey: ["race", id],
//         queryFn: () => getRaceById(id, token),
//         enabled: !!id,
//         staleTime: 1000 * 60 * 5,
//     })
// }

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

// Race Events

export interface RaceEvent {
    id: string
    race_id: string
    name: string
    description?: string
    type?: "registration" | "race" | "awards" | "other"
    scheduled_time: string
    actual_time?: string
    created_at?: string
}

export interface CreateRaceEventInput {
    race_id: string
    name: string
    description?: string
    type?: "registration" | "race" | "awards" | "other"
    scheduled_time: string
    actual_time?: string
}

// ---------- API ----------

export const getRaceEventsByRaceId = async (
    raceId: string,
    token?: string
): Promise<RaceEvent[]> => {
    const res = await api(token).get(`/race-events/race/${raceId}`)
    return res.data
}

export const getRaceEventById = async (
    id: string,
    token?: string
): Promise<RaceEvent> => {
    const res = await api(token).get(`/race-events/${id}`)
    return res.data
}

export const createRaceEvent = async (
    input: CreateRaceEventInput,
    token?: string
): Promise<RaceEvent> => {
    const res = await api(token).post("/race-events", input)
    return res.data
}

export const deleteRaceEvent = async (
    id: string,
    token?: string
): Promise<void> => {
    await api(token).delete(`/race-events/${id}`)
}

// ---------- Hooks ----------

export const useRaceEvents = (raceId?: string) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["race-events", raceId],
        queryFn: () => getRaceEventsByRaceId(raceId!, token),
        enabled: !!raceId,
        staleTime: 1000 * 60 * 5,
    })
}

export const useRaceEvent = (id?: string) => {
    const { session } = useAuth()
    const token = session?.access_token

    return useQuery({
        queryKey: ["race-event", id],
        queryFn: () => getRaceEventById(id!, token),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    })
}

export const useCreateRaceEvent = () => {
    const { session } = useAuth()
    const token = session?.access_token
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (input: CreateRaceEventInput) =>
            createRaceEvent(input, token),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({
                queryKey: ["race-events", variables.race_id],
            })
        },
    })
}

export const useDeleteRaceEvent = () => {
    const { session } = useAuth()
    const token = session?.access_token
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteRaceEvent(id, token),
        onSuccess: (_, id, context: { raceId: string }) => {
            qc.invalidateQueries({
                queryKey: ["race-events", context.raceId],
            })
        },
    })
}
