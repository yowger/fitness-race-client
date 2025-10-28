import { Session } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "expo-router"

import { supabase } from "../lib/supabase"

type AuthContextType = {
    session: Session | null
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    isLoading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return
            setSession(session)
            setIsLoading(false)
        })

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
                if (session) {
                    router.replace({
                        pathname: "/(tabs)/home",
                    })
                } else {
                    router.replace({
                        pathname: "/(auth)/login",
                    })
                }
            }
        )

        return () => {
            mounted = false
            listener?.subscription.unsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ session, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}
