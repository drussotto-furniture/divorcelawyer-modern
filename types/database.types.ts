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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      article_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          wordpress_id: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          wordpress_id?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          wordpress_id?: number | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
          wordpress_id: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "article_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          content: string | null
          county_id: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          population: number | null
          slug: string
          state_id: string | null
          updated_at: string | null
          wordpress_id: number | null
        }
        Insert: {
          content?: string | null
          county_id?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          population?: number | null
          slug: string
          state_id?: string | null
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Update: {
          content?: string | null
          county_id?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          population?: number | null
          slug?: string
          state_id?: string | null
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      counties: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          state_id: string | null
          updated_at: string | null
          wordpress_id: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          state_id?: string | null
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          state_id?: string | null
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "counties_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      emotions: {
        Row: {
          content: string | null
          coping_strategies: string[] | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          wordpress_id: number | null
        }
        Insert: {
          content?: string | null
          coping_strategies?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          wordpress_id?: number | null
        }
        Update: {
          content?: string | null
          coping_strategies?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          wordpress_id?: number | null
        }
        Relationships: []
      }
      law_firms: {
        Row: {
          address: string | null
          city_id: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          rating: number | null
          slug: string
          updated_at: string | null
          verified: boolean | null
          website: string | null
          wordpress_id: number | null
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          rating?: number | null
          slug: string
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          wordpress_id?: number | null
        }
        Update: {
          address?: string | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          rating?: number | null
          slug?: string
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          wordpress_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "law_firms_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_service_areas: {
        Row: {
          city_id: string
          lawyer_id: string
        }
        Insert: {
          city_id: string
          lawyer_id: string
        }
        Update: {
          city_id?: string
          lawyer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_service_areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_service_areas_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyers"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyers: {
        Row: {
          bar_number: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          law_firm_id: string | null
          phone: string | null
          photo_url: string | null
          slug: string
          specializations: string[] | null
          title: string | null
          updated_at: string | null
          wordpress_id: number | null
          years_experience: number | null
        }
        Insert: {
          bar_number?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          law_firm_id?: string | null
          phone?: string | null
          photo_url?: string | null
          slug: string
          specializations?: string[] | null
          title?: string | null
          updated_at?: string | null
          wordpress_id?: number | null
          years_experience?: number | null
        }
        Update: {
          bar_number?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          law_firm_id?: string | null
          phone?: string | null
          photo_url?: string | null
          slug?: string
          specializations?: string[] | null
          title?: string | null
          updated_at?: string | null
          wordpress_id?: number | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lawyers_law_firm_id_fkey"
            columns: ["law_firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          question: string
          slug: string
          wordpress_id: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          question: string
          slug: string
          wordpress_id?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          question?: string
          slug?: string
          wordpress_id?: number | null
        }
        Relationships: []
      }
      stages: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number | null
          slug: string
          wordpress_id: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          slug: string
          wordpress_id?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          slug?: string
          wordpress_id?: number | null
        }
        Relationships: []
      }
      states: {
        Row: {
          abbreviation: string
          content: string | null
          created_at: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          updated_at: string | null
          wordpress_id: number | null
        }
        Insert: {
          abbreviation: string
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Update: {
          abbreviation?: string
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          active: boolean | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          linkedin_url: string | null
          name: string
          order_index: number | null
          phone: string | null
          photo_url: string | null
          slug: string
          title: string | null
          twitter_url: string | null
          updated_at: string | null
          wordpress_id: number | null
        }
        Insert: {
          active?: boolean | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          order_index?: number | null
          phone?: string | null
          photo_url?: string | null
          slug: string
          title?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Update: {
          active?: boolean | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          order_index?: number | null
          phone?: string | null
          photo_url?: string | null
          slug?: string
          title?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          duration_seconds: number | null
          id: string
          published_at: string | null
          slug: string
          status: string | null
          thumbnail_url: string | null
          title: string
          transcript: string | null
          updated_at: string | null
          video_id: string | null
          video_provider: string | null
          video_url: string
          view_count: number | null
          wordpress_id: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          duration_seconds?: number | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string | null
          thumbnail_url?: string | null
          title: string
          transcript?: string | null
          updated_at?: string | null
          video_id?: string | null
          video_provider?: string | null
          video_url: string
          view_count?: number | null
          wordpress_id?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          duration_seconds?: number | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string | null
          video_id?: string | null
          video_provider?: string | null
          video_url?: string
          view_count?: number | null
          wordpress_id?: number | null
        }
        Relationships: []
      }
      zip_codes: {
        Row: {
          city_id: string | null
          created_at: string | null
          id: string
          zip_code: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          zip_code: string
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "zip_codes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
