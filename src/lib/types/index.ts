// Database types
// These will be generated from Supabase later with: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          discord_id: string
          username: string
          avatar_url: string | null
          discord_roles: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          discord_id: string
          username: string
          avatar_url?: string | null
          discord_roles?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          discord_id?: string
          username?: string
          avatar_url?: string | null
          discord_roles?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          name: string
          date: string
          time: string
          map: string | null
          mode: string | null
          game_size: string | null
          faction: string | null
          created_by: string
          playbook_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          date: string
          time: string
          map?: string | null
          mode?: string | null
          game_size?: string | null
          faction?: string | null
          created_by: string
          playbook_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          date?: string
          time?: string
          map?: string | null
          mode?: string | null
          game_size?: string | null
          faction?: string | null
          created_by?: string
          playbook_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      signups: {
        Row: {
          id: string
          game_id: string
          user_id: string
          signed_up_at: string
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          signed_up_at?: string
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          user_id?: string
          signed_up_at?: string
          added_by?: string | null
          created_at?: string
        }
      }
      playbooks: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      squads: {
        Row: {
          id: string
          playbook_id: string
          name: string
          squad_order: number
          created_at: string
        }
        Insert: {
          id?: string
          playbook_id: string
          name: string
          squad_order: number
          created_at?: string
        }
        Update: {
          id?: string
          playbook_id?: string
          name?: string
          squad_order?: number
          created_at?: string
        }
      }
      squad_roles: {
        Row: {
          id: string
          squad_id: string
          role_name: string
          role_order: number
          created_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          role_name: string
          role_order: number
          created_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          role_name?: string
          role_order?: number
          created_at?: string
        }
      }
      squad_tasks: {
        Row: {
          id: string
          squad_id: string
          task_description: string
          task_order: number
          created_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          task_description: string
          task_order: number
          created_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          task_description?: string
          task_order?: number
          created_at?: string
        }
      }
      role_tasks: {
        Row: {
          id: string
          role_id: string
          task_description: string
          task_order: number
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          task_description: string
          task_order: number
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          task_description?: string
          task_order?: number
          created_at?: string
        }
      }
      game_assignments: {
        Row: {
          id: string
          game_id: string
          signup_id: string
          squad_id: string | null
          role_id: string | null
          assigned_at: string
          assigned_by: string
        }
        Insert: {
          id?: string
          game_id: string
          signup_id: string
          squad_id?: string | null
          role_id?: string | null
          assigned_at?: string
          assigned_by: string
        }
        Update: {
          id?: string
          game_id?: string
          signup_id?: string
          squad_id?: string | null
          role_id?: string | null
          assigned_at?: string
          assigned_by?: string
        }
      }
    }
  }
}
