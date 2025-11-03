import * as Location from "expo-location"
import { useEffect, useState } from "react"

type UseLocationResult = {
    location: Location.LocationObject | null
    errorMsg: string | null
    permissionStatus: Location.LocationPermissionResponse | null
    requestPermission: () => Promise<Location.LocationPermissionResponse>
}

export const useLocation = (): UseLocationResult => {
    const [location, setLocation] = useState<Location.LocationObject | null>(
        null
    )
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [permissionStatus, requestPermission] =
        Location.useForegroundPermissions()

    useEffect(() => {
        ;(async () => {
            if (!permissionStatus) return

            if (permissionStatus.status !== "granted") {
                const { status } = await requestPermission()
                if (status !== "granted") {
                    setErrorMsg("Permission to access location was denied")
                    return
                }
            }

            try {
                const currentLocation = await Location.getCurrentPositionAsync(
                    {}
                )
                setLocation(currentLocation)
            } catch (err) {
                setErrorMsg("Failed to get location")
            }
        })()
    }, [permissionStatus?.status])

    return { location, errorMsg, permissionStatus, requestPermission }
}
