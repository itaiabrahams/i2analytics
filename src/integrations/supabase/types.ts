export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      game_actions: {
        Row: {
          created_at: string
          description: string
          id: string
          minute: number
          quarter: number
          score: number
          session_id: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          minute: number
          quarter: number
          score?: number
          session_id: string
          type?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          minute?: number
          quarter?: number
          score?: number
          session_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_actions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      player_goals: {
        Row: {
          category: string
          coach_id: string
          created_at: string
          description: string | null
          id: string
          player_id: string
          progress: number
          progress_notes: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          player_id: string
          progress?: number
          progress_notes?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          player_id?: string
          progress?: number
          progress_notes?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_ratings: {
        Row: {
          coach_id: string
          created_at: string
          defense_rating: number
          effort_rating: number
          id: string
          notes: string | null
          offense_rating: number
          overall_rating: number
          period_end: string
          period_start: string
          period_type: string
          player_id: string
          teamwork_rating: number
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          defense_rating?: number
          effort_rating?: number
          id?: string
          notes?: string | null
          offense_rating?: number
          overall_rating?: number
          period_end: string
          period_start: string
          period_type?: string
          player_id: string
          teamwork_rating?: number
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          defense_rating?: number
          effort_rating?: number
          id?: string
          notes?: string | null
          offense_rating?: number
          overall_rating?: number
          period_end?: string
          period_start?: string
          period_type?: string
          player_id?: string
          teamwork_rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          coach_id: string | null
          created_at: string
          display_name: string
          id: string
          is_approved: boolean
          is_demo: boolean
          position: string | null
          role: Database["public"]["Enums"]["app_role"]
          team: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          coach_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_approved?: boolean
          is_demo?: boolean
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          team?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          coach_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_approved?: boolean
          is_demo?: boolean
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          team?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_meetings: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          meeting_url: string | null
          notes: string | null
          player_id: string
          scheduled_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          player_id: string
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          player_id?: string
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          assists: number
          coach_id: string
          coach_notes: string | null
          created_at: string
          date: string
          fg_percentage: number
          id: string
          meeting_url: string | null
          opponent: string
          overall_score: number
          player_id: string
          points: number
          rebounds: number
          steals: number
          turnovers: number
          updated_at: string
          video_url: string | null
        }
        Insert: {
          assists?: number
          coach_id: string
          coach_notes?: string | null
          created_at?: string
          date: string
          fg_percentage?: number
          id?: string
          meeting_url?: string | null
          opponent: string
          overall_score?: number
          player_id: string
          points?: number
          rebounds?: number
          steals?: number
          turnovers?: number
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          assists?: number
          coach_id?: string
          coach_notes?: string | null
          created_at?: string
          date?: string
          fg_percentage?: number
          id?: string
          meeting_url?: string | null
          opponent?: string
          overall_score?: number
          player_id?: string
          points?: number
          rebounds?: number
          steals?: number
          turnovers?: number
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_head_coach: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "coach" | "player"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["coach", "player"],
    },
  },
} as const
