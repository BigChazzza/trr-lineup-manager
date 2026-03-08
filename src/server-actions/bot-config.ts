'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { botConfigSchema, type BotConfigFormData } from '@/lib/schemas/bot-config'
import { revalidatePath } from 'next/cache'

export async function getBotConfig() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('bot_config')
      .select('*')
      .single()

    // PGRST116 = no rows found (not an error, just empty)
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get configuration'
    }
  }
}

export async function updateBotConfig(formData: BotConfigFormData) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Validate input
    const validated = botConfigSchema.parse(formData)

    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from('bot_config')
      .upsert({
        ...validated,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/bot-config')
    return { success: true, data }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update configuration'
    }
  }
}
