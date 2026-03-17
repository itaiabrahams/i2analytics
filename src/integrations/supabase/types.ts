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
      challenge_entries: {
        Row: {
          attempts: number | null
          challenge_id: string
          id: string
          made: number | null
          percentage: number | null
          player_id: string
          submitted_at: string
          video_url: string | null
        }
        Insert: {
          attempts?: number | null
          challenge_id: string
          id?: string
          made?: number | null
          percentage?: number | null
          player_id: string
          submitted_at?: string
          video_url?: string | null
        }
        Update: {
          attempts?: number | null
          challenge_id?: string
          id?: string
          made?: number | null
          percentage?: number | null
          player_id?: string
          submitted_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      courtiq_answers: {
        Row: {
          answer_time_ms: number
          answered_at: string | null
          id: string
          is_correct: boolean
          player_id: string
          points_earned: number | null
          question_id: string
          selected_option: string
        }
        Insert: {
          answer_time_ms: number
          answered_at?: string | null
          id?: string
          is_correct: boolean
          player_id: string
          points_earned?: number | null
          question_id: string
          selected_option: string
        }
        Update: {
          answer_time_ms?: number
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          player_id?: string
          points_earned?: number | null
          question_id?: string
          selected_option?: string
        }
        Relationships: [
          {
            foreignKeyName: "courtiq_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "courtiq_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      courtiq_categories: {
        Row: {
          color: string
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      courtiq_player_stats: {
        Row: {
          correct_streak: number | null
          current_streak: number | null
          id: string
          last_active_date: string | null
          longest_streak: number | null
          player_id: string
          questions_today: number | null
          total_answered: number | null
          total_correct: number | null
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          correct_streak?: number | null
          current_streak?: number | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          player_id: string
          questions_today?: number | null
          total_answered?: number | null
          total_correct?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          correct_streak?: number | null
          current_streak?: number | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          player_id?: string
          questions_today?: number | null
          total_answered?: number | null
          total_correct?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      courtiq_questions: {
        Row: {
          category_id: string | null
          correct_option: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          explanation: string | null
          id: string
          is_ai_generated: boolean | null
          is_peak: boolean | null
          media_type: string | null
          media_url: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          publish_at: string
          question_text: string
          status: string | null
        }
        Insert: {
          category_id?: string | null
          correct_option: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          explanation?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_peak?: boolean | null
          media_type?: string | null
          media_url?: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          publish_at: string
          question_text: string
          status?: string | null
        }
        Update: {
          category_id?: string | null
          correct_option?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          explanation?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_peak?: boolean | null
          media_type?: string | null
          media_url?: string | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          publish_at?: string
          question_text?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courtiq_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "courtiq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      courtiq_settings: {
        Row: {
          auto_publish_enabled: boolean
          id: string
          publish_end_hour: number
          publish_start_hour: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auto_publish_enabled?: boolean
          id?: string
          publish_end_hour?: number
          publish_start_hour?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auto_publish_enabled?: boolean
          id?: string
          publish_end_hour?: number
          publish_start_hour?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      courtiq_suggestions: {
        Row: {
          category_id: string | null
          correct_option: string | null
          created_at: string | null
          id: string
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          player_id: string
          question_text: string
          status: string | null
        }
        Insert: {
          category_id?: string | null
          correct_option?: string | null
          created_at?: string | null
          id?: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          player_id: string
          question_text: string
          status?: string | null
        }
        Update: {
          category_id?: string | null
          correct_option?: string | null
          created_at?: string | null
          id?: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          player_id?: string
          question_text?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courtiq_suggestions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "courtiq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
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
      player_challenges: {
        Row: {
          challenged_attempts: number | null
          challenged_id: string
          challenged_made: number | null
          challenged_video_url: string | null
          challenger_attempts: number | null
          challenger_id: string
          challenger_made: number | null
          challenger_note: string | null
          challenger_video_url: string | null
          created_at: string
          description: string | null
          expires_at: string
          id: string
          status: string
          target_attempts: number | null
          target_made: number | null
          winner_id: string | null
          zone: string | null
        }
        Insert: {
          challenged_attempts?: number | null
          challenged_id: string
          challenged_made?: number | null
          challenged_video_url?: string | null
          challenger_attempts?: number | null
          challenger_id: string
          challenger_made?: number | null
          challenger_note?: string | null
          challenger_video_url?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          status?: string
          target_attempts?: number | null
          target_made?: number | null
          winner_id?: string | null
          zone?: string | null
        }
        Update: {
          challenged_attempts?: number | null
          challenged_id?: string
          challenged_made?: number | null
          challenged_video_url?: string | null
          challenger_attempts?: number | null
          challenger_id?: string
          challenger_made?: number | null
          challenger_note?: string | null
          challenger_video_url?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          status?: string
          target_attempts?: number | null
          target_made?: number | null
          winner_id?: string | null
          zone?: string | null
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
      player_technique_videos: {
        Row: {
          category: string
          created_at: string
          id: string
          player_id: string
          video_url: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          player_id: string
          video_url: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          player_id?: string
          video_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          coach_id: string | null
          created_at: string
          display_name: string
          id: string
          is_approved: boolean
          is_demo: boolean
          payment_status: string
          phone_number: string | null
          position: string | null
          role: Database["public"]["Enums"]["app_role"]
          subscription_note: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          team: string | null
          team_coach_approved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_approved?: boolean
          is_demo?: boolean
          payment_status?: string
          phone_number?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          subscription_note?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          team?: string | null
          team_coach_approved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_approved?: boolean
          is_demo?: boolean
          payment_status?: string
          phone_number?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          subscription_note?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          team?: string | null
          team_coach_approved?: boolean
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
      shot_sessions: {
        Row: {
          coach_id: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          player_id: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          player_id: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          player_id?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      shots: {
        Row: {
          attempts: number
          created_at: string
          element: string | null
          finish_type: string | null
          id: string
          made: number
          session_id: string
          shot_type: string
          zone: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          element?: string | null
          finish_type?: string | null
          id?: string
          made?: number
          session_id: string
          shot_type?: string
          zone: string
        }
        Update: {
          attempts?: number
          created_at?: string
          element?: string | null
          finish_type?: string | null
          id?: string
          made?: number
          session_id?: string
          shot_type?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "shots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "shot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_coach_feedback: {
        Row: {
          category: string
          coach_name: string
          content: string
          created_at: string
          feedback_token: string
          id: string
          player_id: string
        }
        Insert: {
          category?: string
          coach_name?: string
          content?: string
          created_at?: string
          feedback_token?: string
          id?: string
          player_id: string
        }
        Update: {
          category?: string
          coach_name?: string
          content?: string
          created_at?: string
          feedback_token?: string
          id?: string
          player_id?: string
        }
        Relationships: []
      }
      team_coach_tokens: {
        Row: {
          created_at: string
          id: string
          player_id: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          token?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          token?: string
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
      weekly_challenges: {
        Row: {
          bonus_points: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          period_type: string
          target_attempts: number | null
          target_percentage: number | null
          title: string
          week_end: string
          week_start: string
          zone: string | null
        }
        Insert: {
          bonus_points?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          period_type?: string
          target_attempts?: number | null
          target_percentage?: number | null
          title: string
          week_end?: string
          week_start?: string
          zone?: string | null
        }
        Update: {
          bonus_points?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          period_type?: string
          target_attempts?: number | null
          target_percentage?: number | null
          title?: string
          week_end?: string
          week_start?: string
          zone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_courtiq_questions: { Args: never; Returns: Json }
      get_courtiq_leaderboard: { Args: { _period: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_head_coach: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      submit_courtiq_answer: {
        Args: {
          _answer_time_ms: number
          _question_id: string
          _selected_option: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "coach" | "player"
      subscription_tier: "free" | "basic" | "premium"
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
      subscription_tier: ["free", "basic", "premium"],
    },
  },
} as const
