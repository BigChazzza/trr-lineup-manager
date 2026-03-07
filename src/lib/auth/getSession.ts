import { createClient } from '@/lib/supabase/server'

export async function getSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  // Don't log "Auth session missing" as an error - it's expected for logged out users
  if (error && error.message !== 'Auth session missing!') {
    console.error('Error getting session:', error)
  }

  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // Don't log "Auth session missing" as an error - it's expected for logged out users
  if (error && error.message !== 'Auth session missing!') {
    console.error('Error getting user:', error)
  }

  return user
}
