'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/getSession'
import { requireAdmin } from '@/lib/auth/roles'
import { playbookSchema, type PlaybookFormData } from '@/lib/schemas/playbooks'
import { revalidatePath } from 'next/cache'

export async function createPlaybook(formData: PlaybookFormData) {
  try {
    // Verify user is admin
    await requireAdmin()

    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Get user's database ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', user.user_metadata?.provider_id)
      .single()

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    // Validate input
    const validatedData = playbookSchema.parse(formData)

    // Step 1: Create playbook
    const { data: playbook, error: playbookError } = await supabase
      .from('playbooks')
      .insert({
        name: validatedData.name,
        description: validatedData.description || null,
        is_default: validatedData.is_default,
        google_doc_link: validatedData.google_doc_link || null,
        created_by: userData.id,
      })
      .select()
      .single()

    if (playbookError) {
      console.error('Error creating playbook:', playbookError)
      return { success: false, error: playbookError.message }
    }

    // Step 2: Create squads and collect their IDs
    const squadsToInsert = validatedData.squads.map((squad, index) => ({
      playbook_id: playbook.id,
      name: squad.name,
      squad_order: squad.squad_order ?? index,
    }))

    const { data: createdSquads, error: squadsError } = await supabase
      .from('squads')
      .insert(squadsToInsert)
      .select()

    if (squadsError) {
      console.error('Error creating squads:', squadsError)
      return { success: false, error: 'Failed to create squads: ' + squadsError.message }
    }

    // Step 3: Create roles and tasks for each squad
    const roleInserts = []
    const taskInserts = []

    for (let i = 0; i < validatedData.squads.length; i++) {
      const squad = validatedData.squads[i]
      const createdSquad = createdSquads[i]

      // Prepare role inserts
      for (let j = 0; j < squad.roles.length; j++) {
        const role = squad.roles[j]
        roleInserts.push({
          squad_id: createdSquad.id,
          role_name: role.role_name,
          role_order: role.role_order ?? j,
        })
      }

      // Prepare task inserts
      for (let j = 0; j < squad.tasks.length; j++) {
        const task = squad.tasks[j]
        taskInserts.push({
          squad_id: createdSquad.id,
          task_description: task.task_description,
          task_order: task.task_order ?? j,
        })
      }
    }

    // Insert roles if any
    if (roleInserts.length > 0) {
      const { error: rolesError } = await supabase
        .from('squad_roles')
        .insert(roleInserts)

      if (rolesError) {
        console.error('Error creating squad roles:', rolesError)
        // Continue despite role errors, playbook is already created
      }
    }

    // Insert tasks if any
    if (taskInserts.length > 0) {
      const { error: tasksError } = await supabase
        .from('squad_tasks')
        .insert(taskInserts)

      if (tasksError) {
        console.error('Error creating squad tasks:', tasksError)
        // Continue despite task errors, playbook is already created
      }
    }

    revalidatePath('/playbooks')
    revalidatePath('/')

    return { success: true, data: playbook }
  } catch (error: unknown) {
    console.error('Error in createPlaybook:', error)
    return { success: false, error: error.message || 'Failed to create playbook' }
  }
}

export async function updatePlaybook(playbookId: string, formData: PlaybookFormData) {
  try {
    // Verify user is admin
    await requireAdmin()

    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Validate input
    const validatedData = playbookSchema.parse(formData)

    // Step 1: Update playbook basic info
    const { data: playbook, error: playbookError } = await supabase
      .from('playbooks')
      .update({
        name: validatedData.name,
        description: validatedData.description || null,
        is_default: validatedData.is_default,
        google_doc_link: validatedData.google_doc_link || null,
      })
      .eq('id', playbookId)
      .select()
      .single()

    if (playbookError) {
      console.error('Error updating playbook:', playbookError)
      return { success: false, error: playbookError.message }
    }

    // Step 2: Delete all existing squads (cascade deletes roles and tasks)
    const { error: deleteError } = await supabase
      .from('squads')
      .delete()
      .eq('playbook_id', playbookId)

    if (deleteError) {
      console.error('Error deleting old squads:', deleteError)
      return { success: false, error: 'Failed to delete old squads: ' + deleteError.message }
    }

    // Step 3: Create new squads
    const squadsToInsert = validatedData.squads.map((squad, index) => ({
      playbook_id: playbookId,
      name: squad.name,
      squad_order: squad.squad_order ?? index,
    }))

    const { data: createdSquads, error: squadsError } = await supabase
      .from('squads')
      .insert(squadsToInsert)
      .select()

    if (squadsError) {
      console.error('Error creating squads:', squadsError)
      return { success: false, error: 'Failed to create squads: ' + squadsError.message }
    }

    // Step 4: Create roles and tasks for each squad
    const roleInserts = []
    const taskInserts = []

    for (let i = 0; i < validatedData.squads.length; i++) {
      const squad = validatedData.squads[i]
      const createdSquad = createdSquads[i]

      // Prepare role inserts
      for (let j = 0; j < squad.roles.length; j++) {
        const role = squad.roles[j]
        roleInserts.push({
          squad_id: createdSquad.id,
          role_name: role.role_name,
          role_order: role.role_order ?? j,
        })
      }

      // Prepare task inserts
      for (let j = 0; j < squad.tasks.length; j++) {
        const task = squad.tasks[j]
        taskInserts.push({
          squad_id: createdSquad.id,
          task_description: task.task_description,
          task_order: task.task_order ?? j,
        })
      }
    }

    // Insert roles if any
    if (roleInserts.length > 0) {
      const { error: rolesError } = await supabase
        .from('squad_roles')
        .insert(roleInserts)

      if (rolesError) {
        console.error('Error creating squad roles:', rolesError)
        // Continue despite role errors
      }
    }

    // Insert tasks if any
    if (taskInserts.length > 0) {
      const { error: tasksError } = await supabase
        .from('squad_tasks')
        .insert(taskInserts)

      if (tasksError) {
        console.error('Error creating squad tasks:', tasksError)
        // Continue despite task errors
      }
    }

    revalidatePath('/playbooks')
    revalidatePath(`/playbooks/${playbookId}`)
    revalidatePath('/')

    return { success: true, data: playbook }
  } catch (error: unknown) {
    console.error('Error in updatePlaybook:', error)
    return { success: false, error: error.message || 'Failed to update playbook' }
  }
}

export async function deletePlaybook(id: string) {
  try {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase
      .from('playbooks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting playbook:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/playbooks')
    revalidatePath('/')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error in deletePlaybook:', error)
    return { success: false, error: error.message || 'Failed to delete playbook' }
  }
}
