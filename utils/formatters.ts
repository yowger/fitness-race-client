export const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export const calculatePace = (time: number, distance: number): string => {
    if (distance === 0) return "0:00"

    const paceInSeconds = time / distance
    const mins = Math.floor(paceInSeconds / 60)
    const secs = Math.floor(paceInSeconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
}
