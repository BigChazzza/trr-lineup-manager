import { createClient } from '@/lib/supabase/server'

// Admin role names that have access to admin features
const ADMIN_ROLES = ['Tactician', 'Admin']

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return false
  }

  // Get user's Discord roles from the users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('discord_roles')
    .eq('discord_id', user.user_metadata?.provider_id)
    .single()

  if (userError || !userData) {
    return false
  }

  // Check if user has any admin role
  const userRoles = userData.discord_roles as string[] || []
  return userRoles.some(role => ADMIN_ROLES.includes(role))
}

export async function requireAdmin() {
  const isUserAdmin = await isAdmin()
  if (!isUserAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }
  return true
}
