export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          feature: string | null
          id: string
          job_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          feature?: string | null
          id?: string
          job_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          feature?: string | null
          id?: string
          job_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_favorite: boolean | null
          job_id: string | null
          language: string | null
          media_file_id: string | null
          metadata: Json | null
          title: string | null
          type: Database["public"]["Enums"]["content_type"]
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          job_id?: string | null
          language?: string | null
          media_file_id?: string | null
          metadata?: Json | null
          title?: string | null
          type: Database["public"]["Enums"]["content_type"]
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          job_id?: string | null
          language?: string | null
          media_file_id?: string | null
          metadata?: Json | null
          title?: string | null
          type?: Database["public"]["Enums"]["content_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          bucket: string
          created_at: string
          duration_seconds: number | null
          expires_at: string | null
          filename: string
          height: number | null
          id: string
          is_processed: boolean | null
          media_type: Database["public"]["Enums"]["media_type"]
          metadata: Json | null
          mime_type: string
          original_filename: string | null
          path: string
          size_bytes: number
          user_id: string
          width: number | null
        }
        Insert: {
          bucket: string
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          filename: string
          height?: number | null
          id?: string
          is_processed?: boolean | null
          media_type: Database["public"]["Enums"]["media_type"]
          metadata?: Json | null
          mime_type: string
          original_filename?: string | null
          path: string
          size_bytes: number
          user_id: string
          width?: number | null
        }
        Update: {
          bucket?: string
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          filename?: string
          height?: number | null
          id?: string
          is_processed?: boolean | null
          media_type?: Database["public"]["Enums"]["media_type"]
          metadata?: Json | null
          mime_type?: string
          original_filename?: string | null
          path?: string
          size_bytes?: number
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_charged: number | null
          error: string | null
          external_job_id: string | null
          id: string
          input_data: Json
          output_data: Json | null
          priority: number | null
          progress: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_charged?: number | null
          error?: string | null
          external_job_id?: string | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          priority?: number | null
          progress?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type: Database["public"]["Enums"]["job_type"]
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_charged?: number | null
          error?: string | null
          external_job_id?: string | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          priority?: number | null
          progress?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          data: Json
          description: string | null
          duration_seconds: number | null
          export_count: number | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          last_exported_at: string | null
          name: string
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          description?: string | null
          duration_seconds?: number | null
          export_count?: number | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          last_exported_at?: string | null
          name: string
          thumbnail_url?: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          description?: string | null
          duration_seconds?: number | null
          export_count?: number | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          last_exported_at?: string | null
          name?: string
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          credits_monthly: number
          features: Json | null
          id: string
          is_active: boolean | null
          max_export_quality: string | null
          max_video_duration_minutes: number | null
          name: string
          price_monthly: number | null
          storage_limit_gb: number
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          credits_monthly?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_export_quality?: string | null
          max_video_duration_minutes?: number | null
          name: string
          price_monthly?: number | null
          storage_limit_gb?: number
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          credits_monthly?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_export_quality?: string | null
          max_video_duration_minutes?: number | null
          name?: string
          price_monthly?: number | null
          storage_limit_gb?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          last_reset_at: string | null
          lifetime_earned: number
          lifetime_spent: number
          next_reset_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          last_reset_at?: string | null
          lifetime_earned?: number
          lifetime_spent?: number
          next_reset_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          last_reset_at?: string | null
          lifetime_earned?: number
          lifetime_spent?: number
          next_reset_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          locale: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      voice_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          last_used_at: string | null
          model_id: string | null
          name: string
          provider: string | null
          sample_duration_seconds: number | null
          sample_file_id: string | null
          settings: Json | null
          status: Database["public"]["Enums"]["voice_status"]
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          last_used_at?: string | null
          model_id?: string | null
          name: string
          provider?: string | null
          sample_duration_seconds?: number | null
          sample_file_id?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["voice_status"]
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          last_used_at?: string | null
          model_id?: string | null
          name?: string
          provider?: string | null
          sample_duration_seconds?: number | null
          sample_file_id?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["voice_status"]
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_profiles_sample_file_id_fkey"
            columns: ["sample_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_reason: string
          p_type?: Database["public"]["Enums"]["transaction_type"]
          p_user_id: string
        }
        Returns: {
          new_balance: number
          success: boolean
        }[]
      }
      check_storage_limit: {
        Args: { p_user_id: string }
        Returns: {
          can_upload: boolean
          limit_bytes: number
          used_bytes: number
          used_percentage: number
        }[]
      }
      consume_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_feature: string
          p_job_id?: string
          p_user_id: string
        }
        Returns: {
          error_message: string
          new_balance: number
          success: boolean
        }[]
      }
      get_user_stats: {
        Args: { p_user_id: string }
        Returns: {
          credits_balance: number
          credits_next_reset: string
          exports_count: number
          plan_name: string
          projects_count: number
          storage_limit_bytes: number
          storage_used_bytes: number
        }[]
      }
      reset_monthly_credits: { Args: Record<PropertyKey, never>; Returns: number }
    }
    Enums: {
      content_type:
        | "transcript"
        | "script"
        | "voice_audio"
        | "generated_image"
        | "exported_video"
        | "subtitles"
      job_status: "pending" | "processing" | "completed" | "failed" | "canceled"
      job_type:
        | "transcription"
        | "voice_clone"
        | "text_to_speech"
        | "script_generation"
        | "image_generation"
        | "video_export"
        | "media_processing"
        | "background_removal"
        | "vocal_separation"
      media_type: "video" | "audio" | "image" | "document"
      project_type:
        | "video_ranking"
        | "split_screen"
        | "story_video"
        | "text_story"
        | "reddit_video"
        | "auto_clip"
        | "voice_clone"
        | "custom_edit"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "paused"
        | "incomplete"
      transaction_type: "credit" | "debit" | "reset" | "bonus" | "refund"
      voice_status: "pending" | "processing" | "ready" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

