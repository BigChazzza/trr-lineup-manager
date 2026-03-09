import { createClient } from '@/lib/supabase/server'

export async function getGames(status?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('games')
    .select(`
      *,
      created_by_user:users!games_created_by_fkey(username, server_nickname, avatar_url),
      playbook:playbooks(name)
    `)
    .order('date', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching games:', error)
    return []
  }

  return data
}

export async function getGameById(id: string) {
  const supabase = await createClient()

  // First get the game data
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select(`
      *,
      created_by_user:users!games_created_by_fkey(username, server_nickname, avatar_url),
      signups(
        id,
        user_id,
        signed_up_at,
        role_preference,
        user:users!signups_user_id_fkey(id, username, server_nickname, avatar_url),
        assignment:game_assignments(squad_id, role_id)
      )
    `)
    .eq('id', id)
    .single()

  if (gameError) {
    console.error('Error fetching game:', gameError)
    return null
  }

  // If game has a playbook, fetch it separately
  let playbookData = null
  if (game.playbook_id) {
    const { data: playbook } = await supabase
      .from('playbooks')
      .select(`
        id,
        name,
        description,
        squads(
          id,
          name,
          squad_order,
          squad_roles(id, role_name, role_order),
          squad_tasks(id, task_description, task_order)
        )
      `)
      .eq('id', game.playbook_id)
      .single()

    playbookData = playbook
  }

  return {
    ...game,
    playbook: playbookData
  }
}

export async function getGameSignups(gameId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('signups')
    .select(`
      *,
      user:users(id, username, server_nickname, avatar_url),
      assignment:game_assignments(
        id,
        squad_id,
        role_id,
        squad:squads(id, name),
        role:squad_roles(id, role_name)
      )
    `)
    .eq('game_id', gameId)
    .order('signed_up_at', { ascending: true })

  if (error) {
    console.error('Error fetching signups:', error)
    return []
  }

  return data
}

export async function getUserSignupForGame(gameId: string, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('signups')
    .select('*')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error checking signup:', error)
    return null
  }

  return data
}
