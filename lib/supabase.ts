import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

// const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string
// const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY as string
const supabaseUrl = "https://tzinwldhounghqxahiuc.supabase.co"
const supabasePublishableKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aW53bGRob3VuZ2hxeGFoaXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzEzODIsImV4cCI6MjA3NjY0NzM4Mn0.ISIQbAtiDAo2gngmrWocJQGc5YHYAc7RIAL8hcVVEVU"

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})
