import { z } from 'zod'

// Schema for squad role within a squad
export const squadRoleSchema = z.object({
  role_name: z.string().min(1, 'Role name is required').max(100),
  role_order: z.number().int().min(0),
})

// Schema for squad task within a squad
export const squadTaskSchema = z.object({
  task_description: z.string().min(1, 'Task description is required').max(500),
  task_order: z.number().int().min(0),
})

// Schema for a squad within a playbook
export const squadSchema = z.object({
  name: z.string().min(1, 'Squad name is required').max(100),
  squad_order: z.number().int().min(0),
  roles: z.array(squadRoleSchema).min(1, 'At least one role is required per squad'),
  tasks: z.array(squadTaskSchema),
})

// Main playbook schema for form validation
export const playbookSchema = z.object({
  name: z.string().min(1, 'Playbook name is required').max(100),
  description: z.string().max(500).optional(),
  is_default: z.boolean(),
  google_doc_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  squads: z.array(squadSchema).min(1, 'At least one squad is required'),
})

export type PlaybookFormData = z.infer<typeof playbookSchema>
export type SquadFormData = z.infer<typeof squadSchema>
export type SquadRoleFormData = z.infer<typeof squadRoleSchema>
export type SquadTaskFormData = z.infer<typeof squadTaskSchema>
