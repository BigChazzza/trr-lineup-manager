import { z } from 'zod'

export const botConfigSchema = z.object({
  guild_id: z.string().min(1, 'Guild ID is required'),
  signup_category_id: z.string().min(1, 'Category ID is required'),
})

export type BotConfigFormData = z.infer<typeof botConfigSchema>
