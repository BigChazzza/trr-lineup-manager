import { PlaybookFormData } from './schemas/playbooks'

export const OFFENSIVE_UNITS_TEMPLATE: PlaybookFormData = {
  name: 'Offensive Units',
  description: 'Four offensive squads positioned across the battlefield',
  is_default: false,
  squads: [
    {
      name: '1.1 - Playing left hand side',
      squad_order: 0,
      roles: [
        { role_name: 'Squad Leader', role_order: 0 },
        { role_name: 'Automatic Rifleman', role_order: 1 },
        { role_name: 'Medic', role_order: 2 },
        { role_name: 'Engineer', role_order: 3 },
        { role_name: 'Anti-Tank', role_order: 4 },
        { role_name: 'Rifleman', role_order: 5 },
      ],
      tasks: [
        { task_description: 'Control left flank', task_order: 0 },
        { task_description: 'Build garrison at key position', task_order: 1 },
      ],
    },
    {
      name: '1.2 - Playing Central left',
      squad_order: 1,
      roles: [
        { role_name: 'Squad Leader', role_order: 0 },
        { role_name: 'Automatic Rifleman', role_order: 1 },
        { role_name: 'Medic', role_order: 2 },
        { role_name: 'Support', role_order: 3 },
        { role_name: 'Assault', role_order: 4 },
        { role_name: 'Rifleman', role_order: 5 },
      ],
      tasks: [
        { task_description: 'Secure central left position', task_order: 0 },
        { task_description: 'Support center point capture', task_order: 1 },
      ],
    },
    {
      name: '1.3 - Playing Central right',
      squad_order: 2,
      roles: [
        { role_name: 'Squad Leader', role_order: 0 },
        { role_name: 'Machine Gunner', role_order: 1 },
        { role_name: 'Medic', role_order: 2 },
        { role_name: 'Support', role_order: 3 },
        { role_name: 'Assault', role_order: 4 },
        { role_name: 'Rifleman', role_order: 5 },
      ],
      tasks: [
        { task_description: 'Secure central right position', task_order: 0 },
        { task_description: 'Provide covering fire for advance', task_order: 1 },
      ],
    },
    {
      name: '1.4 - Playing right hand side',
      squad_order: 3,
      roles: [
        { role_name: 'Squad Leader', role_order: 0 },
        { role_name: 'Automatic Rifleman', role_order: 1 },
        { role_name: 'Medic', role_order: 2 },
        { role_name: 'Engineer', role_order: 3 },
        { role_name: 'Anti-Tank', role_order: 4 },
        { role_name: 'Rifleman', role_order: 5 },
      ],
      tasks: [
        { task_description: 'Control right flank', task_order: 0 },
        { task_description: 'Build garrison at key position', task_order: 1 },
      ],
    },
  ],
}

export const PLAYBOOK_TEMPLATES = {
  'Offensive Units': OFFENSIVE_UNITS_TEMPLATE,
} as const

export type TemplateName = keyof typeof PLAYBOOK_TEMPLATES
