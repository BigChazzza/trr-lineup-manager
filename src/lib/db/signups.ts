import { createClient } from '@/lib/supabase/server'

export async function getUserSignups(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('signups')
    .select(`
      *,
      game:games(
        id,
        name,
        date,
        time,
        map,
        mode,
        status
      )
    `)
    .eq('user_id', userId)
    .order('signed_up_at', { ascending: false })

  if (error) {
    console.error('Error fetching user signups:', error)
    return []
  }

  return data
}

export async function getSignupWithAssignment(signupId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('signups')
    .select(`
      *,
      game:games(*),
      assignment:game_assignments(
        *,
        squad:squads(
          id,
          name,
          squad_tasks(id, task_description, task_order)
        ),
        role:squad_roles(id, role_name)
      )
    `)
    .eq('id', signupId)
    .single()

  if (error) {
    console.error('Error fetching signup:', error)
    return null
  }

  return data
}
