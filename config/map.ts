export const MAPTILER_API_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY
export const MAPTILER_STYLE = process.env.EXPO_PUBLIC_MAP_STYLE

export const MAP_STYLE_URL = `https://api.maptiler.com/maps/${MAPTILER_STYLE}/style.json?key=${MAPTILER_API_KEY}`
