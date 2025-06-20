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
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          role: 'owner' | 'member'
          team_id: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          role?: 'owner' | 'member'
          team_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          role?: 'owner' | 'member'
          team_id?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          owner_id: string
          member_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          owner_id: string
          member_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          owner_id?: string
          member_count?: number
        }
      }
      team_invites: {
        Row: {
          id: string
          created_at: string
          team_id: string
          email: string
          status: 'pending' | 'accepted' | 'rejected'
          expires_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          team_id: string
          email: string
          status?: 'pending' | 'accepted' | 'rejected'
          expires_at: string
        }
        Update: {
          id?: string
          created_at?: string
          team_id?: string
          email?: string
          status?: 'pending' | 'accepted' | 'rejected'
          expires_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 