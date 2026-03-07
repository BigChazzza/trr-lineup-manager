'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(
  userId: string,
  role: 'Tactician' | 'Admin',
  add: boolean
) {
  try {
    // Verify user is admin
    await requireAdmin()

    const supabase = await createClient()

    // Fetch current user and roles
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('discord_roles')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      return { success: false, error: 'User not found' }
    }

    // Update roles array
    let roles = (user.discord_roles as string[]) || []

    if (add && !roles.includes(role)) {
      roles.push(role)
    } else if (!add) {
      roles = roles.filter((r: string) => r !== role)
    }

    // Save updated roles
    const { error: updateError } = await supabase
      .from('users')
      .update({ discord_roles: roles })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error in updateUserRole:', error)
    return { success: false, error: error.message || 'Failed to update user role' }
  }
}
