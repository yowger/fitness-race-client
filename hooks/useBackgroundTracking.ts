import { useEffect } from "react"
import BackgroundGeolocation, {
    Location,
    State,
} from "react-native-background-geolocation"

export interface LocationUpdate {
    latitude: number
    longitude: number
}

export type OnLocationUpdate = (location: LocationUpdate) => void

export const useBackgroundTracking = (onLocationUpdate: OnLocationUpdate) => {
    useEffect(() => {
        BackgroundGeolocation.ready(
            {
                desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
                distanceFilter: 5,
                stopOnTerminate: false,
                startOnBoot: true,
                // debug: false,
                // logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
                debug: true,
                logLevel: BackgroundGeolocation.LOG_LEVEL_INFO,
            },
            (state) => {
                if (!state.enabled) {
                    BackgroundGeolocation.start()
                }
            }
        )

        const locationSubscription = BackgroundGeolocation.onLocation(
            (location: Location) => {
                const { latitude, longitude } = location.coords
                onLocationUpdate({ latitude, longitude })
            },
            (error) => {
                console.error("[location] ERROR -", error)
            }
        )

        return () => {
            locationSubscription.remove()
            BackgroundGeolocation.stop()
        }
    }, [])
}
