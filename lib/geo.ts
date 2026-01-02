export const getBoundsFromCoords = (coords: [number, number][]) => {
    let minLng = coords[0][0]
    let minLat = coords[0][1]
    let maxLng = coords[0][0]
    let maxLat = coords[0][1]

    coords.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng)
        minLat = Math.min(minLat, lat)
        maxLng = Math.max(maxLng, lng)
        maxLat = Math.max(maxLat, lat)
    })

    return [
        [minLng, minLat],
        [maxLng, maxLat],
    ] as [[number, number], [number, number]]
}