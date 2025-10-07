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
      aoe_templates: {
        Row: {
          color: string | null
          created_at: string | null
          encounter_id: string | null
          id: string
          label: string | null
          length: number | null
          map_id: string
          opacity: number | null
          radius: number | null
          rotation: number | null
          shape: string
          width: number | null
          x: number
          y: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          encounter_id?: string | null
          id?: string
          label?: string | null
          length?: number | null
          map_id: string
          opacity?: number | null
          radius?: number | null
          rotation?: number | null
          shape: string
          width?: number | null
          x: number
          y: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          encounter_id?: string | null
          id?: string
          label?: string | null
          length?: number | null
          map_id?: string
          opacity?: number | null
          radius?: number | null
          rotation?: number | null
          shape?: string
          width?: number | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "aoe_templates_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aoe_templates_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          code: string
          created_at: string | null
          dm_user_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          dm_user_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          dm_user_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      characters: {
        Row: {
          ac: number
          campaign_id: string | null
          cha_save: number | null
          class: string
          con_save: number | null
          created_at: string | null
          current_hp: number
          dex_save: number | null
          id: string
          immunities: Database["public"]["Enums"]["damage_type"][] | null
          int_save: number | null
          level: number
          max_hp: number
          name: string
          passive_perception: number | null
          proficiency_bonus: number
          resistances: Database["public"]["Enums"]["damage_type"][] | null
          speed: number | null
          str_save: number | null
          temp_hp: number | null
          updated_at: string | null
          user_id: string
          vulnerabilities: Database["public"]["Enums"]["damage_type"][] | null
          wis_save: number | null
        }
        Insert: {
          ac: number
          campaign_id?: string | null
          cha_save?: number | null
          class: string
          con_save?: number | null
          created_at?: string | null
          current_hp: number
          dex_save?: number | null
          id?: string
          immunities?: Database["public"]["Enums"]["damage_type"][] | null
          int_save?: number | null
          level?: number
          max_hp: number
          name: string
          passive_perception?: number | null
          proficiency_bonus: number
          resistances?: Database["public"]["Enums"]["damage_type"][] | null
          speed?: number | null
          str_save?: number | null
          temp_hp?: number | null
          updated_at?: string | null
          user_id: string
          vulnerabilities?: Database["public"]["Enums"]["damage_type"][] | null
          wis_save?: number | null
        }
        Update: {
          ac?: number
          campaign_id?: string | null
          cha_save?: number | null
          class?: string
          con_save?: number | null
          created_at?: string | null
          current_hp?: number
          dex_save?: number | null
          id?: string
          immunities?: Database["public"]["Enums"]["damage_type"][] | null
          int_save?: number | null
          level?: number
          max_hp?: number
          name?: string
          passive_perception?: number | null
          proficiency_bonus?: number
          resistances?: Database["public"]["Enums"]["damage_type"][] | null
          speed?: number | null
          str_save?: number | null
          temp_hp?: number | null
          updated_at?: string | null
          user_id?: string
          vulnerabilities?: Database["public"]["Enums"]["damage_type"][] | null
          wis_save?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      combat_log: {
        Row: {
          action_type: string
          character_id: string | null
          created_at: string | null
          details: Json | null
          encounter_id: string | null
          id: string
          message: string
          round: number
        }
        Insert: {
          action_type: string
          character_id?: string | null
          created_at?: string | null
          details?: Json | null
          encounter_id?: string | null
          id?: string
          message: string
          round: number
        }
        Update: {
          action_type?: string
          character_id?: string | null
          created_at?: string | null
          details?: Json | null
          encounter_id?: string | null
          id?: string
          message?: string
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "combat_log_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_log_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      effects: {
        Row: {
          character_id: string | null
          concentrating_character_id: string | null
          created_at: string | null
          damage_per_tick: number | null
          damage_type_per_tick:
            | Database["public"]["Enums"]["damage_type"]
            | null
          description: string | null
          encounter_id: string | null
          end_round: number | null
          id: string
          name: string
          notes: string | null
          requires_concentration: boolean | null
          source: string | null
          start_round: number
          ticks_at: Database["public"]["Enums"]["effect_tick_timing"] | null
          updated_at: string | null
        }
        Insert: {
          character_id?: string | null
          concentrating_character_id?: string | null
          created_at?: string | null
          damage_per_tick?: number | null
          damage_type_per_tick?:
            | Database["public"]["Enums"]["damage_type"]
            | null
          description?: string | null
          encounter_id?: string | null
          end_round?: number | null
          id?: string
          name: string
          notes?: string | null
          requires_concentration?: boolean | null
          source?: string | null
          start_round: number
          ticks_at?: Database["public"]["Enums"]["effect_tick_timing"] | null
          updated_at?: string | null
        }
        Update: {
          character_id?: string | null
          concentrating_character_id?: string | null
          created_at?: string | null
          damage_per_tick?: number | null
          damage_type_per_tick?:
            | Database["public"]["Enums"]["damage_type"]
            | null
          description?: string | null
          encounter_id?: string | null
          end_round?: number | null
          id?: string
          name?: string
          notes?: string | null
          requires_concentration?: boolean | null
          source?: string | null
          start_round?: number
          ticks_at?: Database["public"]["Enums"]["effect_tick_timing"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "effects_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "effects_concentrating_character_id_fkey"
            columns: ["concentrating_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "effects_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          current_round: number | null
          id: string
          is_active: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          current_round?: number | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          current_round?: number | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      fog_regions: {
        Row: {
          created_at: string | null
          id: string
          is_hidden: boolean | null
          map_id: string
          path: Json
          shape: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          map_id: string
          path: Json
          shape: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          map_id?: string
          path?: Json
          shape?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fog_regions_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
        ]
      }
      handouts: {
        Row: {
          campaign_id: string
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string | null
          id: string
          is_revealed: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          content_text?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          id?: string
          is_revealed?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          id?: string
          is_revealed?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handouts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative: {
        Row: {
          character_id: string | null
          created_at: string | null
          encounter_id: string | null
          id: string
          initiative_roll: number
          is_current_turn: boolean | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string | null
          encounter_id?: string | null
          id?: string
          initiative_roll: number
          is_current_turn?: boolean | null
        }
        Update: {
          character_id?: string | null
          created_at?: string | null
          encounter_id?: string | null
          id?: string
          initiative_roll?: number
          is_current_turn?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "initiative_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      loot_items: {
        Row: {
          assigned_to_character_id: string | null
          campaign_id: string
          created_at: string | null
          description: string | null
          encounter_id: string | null
          id: string
          identified: boolean | null
          is_magic: boolean | null
          name: string
          quantity: number
          updated_at: string | null
          value_gp: number
        }
        Insert: {
          assigned_to_character_id?: string | null
          campaign_id: string
          created_at?: string | null
          description?: string | null
          encounter_id?: string | null
          id?: string
          identified?: boolean | null
          is_magic?: boolean | null
          name: string
          quantity?: number
          updated_at?: string | null
          value_gp?: number
        }
        Update: {
          assigned_to_character_id?: string | null
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          encounter_id?: string | null
          id?: string
          identified?: boolean | null
          is_magic?: boolean | null
          name?: string
          quantity?: number
          updated_at?: string | null
          value_gp?: number
        }
        Relationships: [
          {
            foreignKeyName: "loot_items_assigned_to_character_id_fkey"
            columns: ["assigned_to_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loot_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loot_items_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      maps: {
        Row: {
          campaign_id: string
          created_at: string | null
          encounter_id: string | null
          grid_enabled: boolean | null
          grid_size: number | null
          height: number
          id: string
          image_url: string
          name: string
          scale_feet_per_square: number | null
          updated_at: string | null
          width: number
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          encounter_id?: string | null
          grid_enabled?: boolean | null
          grid_size?: number | null
          height: number
          id?: string
          image_url: string
          name: string
          scale_feet_per_square?: number | null
          updated_at?: string | null
          width: number
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          encounter_id?: string | null
          grid_enabled?: boolean | null
          grid_size?: number | null
          height?: number
          id?: string
          image_url?: string
          name?: string
          scale_feet_per_square?: number | null
          updated_at?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "maps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maps_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      npcs: {
        Row: {
          campaign_id: string
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          portrait_url: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          portrait_url?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          portrait_url?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "npcs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      player_presence: {
        Row: {
          campaign_id: string
          character_id: string
          created_at: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          needs_ruling: boolean | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          character_id: string
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          needs_ruling?: boolean | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          character_id?: string
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          needs_ruling?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_presence_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_presence_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_steps: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_completed: boolean | null
          quest_id: string
          step_order: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          is_completed?: boolean | null
          quest_id: string
          step_order: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_completed?: boolean | null
          quest_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_steps_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          campaign_id: string
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          quest_giver: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          quest_giver?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          quest_giver?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      save_prompts: {
        Row: {
          ability: Database["public"]["Enums"]["ability_score"]
          created_at: string | null
          dc: number
          description: string
          encounter_id: string | null
          id: string
          target_character_ids: string[] | null
        }
        Insert: {
          ability: Database["public"]["Enums"]["ability_score"]
          created_at?: string | null
          dc: number
          description: string
          encounter_id?: string | null
          id?: string
          target_character_ids?: string[] | null
        }
        Update: {
          ability?: Database["public"]["Enums"]["ability_score"]
          created_at?: string | null
          dc?: number
          description?: string
          encounter_id?: string | null
          id?: string
          target_character_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "save_prompts_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      save_results: {
        Row: {
          character_id: string | null
          created_at: string | null
          id: string
          modifier: number
          roll: number
          save_prompt_id: string | null
          success: boolean
          total: number
        }
        Insert: {
          character_id?: string | null
          created_at?: string | null
          id?: string
          modifier: number
          roll: number
          save_prompt_id?: string | null
          success: boolean
          total: number
        }
        Update: {
          character_id?: string | null
          created_at?: string | null
          id?: string
          modifier?: number
          roll?: number
          save_prompt_id?: string | null
          success?: boolean
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "save_results_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "save_results_save_prompt_id_fkey"
            columns: ["save_prompt_id"]
            isOneToOne: false
            referencedRelation: "save_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          character_id: string | null
          color: string | null
          created_at: string | null
          encounter_id: string | null
          facing: number | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          map_id: string
          name: string
          size: number | null
          updated_at: string | null
          x: number
          y: number
        }
        Insert: {
          character_id?: string | null
          color?: string | null
          created_at?: string | null
          encounter_id?: string | null
          facing?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          map_id: string
          name: string
          size?: number | null
          updated_at?: string | null
          x: number
          y: number
        }
        Update: {
          character_id?: string | null
          color?: string | null
          created_at?: string | null
          encounter_id?: string | null
          facing?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          map_id?: string
          name?: string
          size?: number | null
          updated_at?: string | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "tokens_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tokens_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tokens_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_campaign_member: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ability_score: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA"
      damage_type:
        | "acid"
        | "bludgeoning"
        | "cold"
        | "fire"
        | "force"
        | "lightning"
        | "necrotic"
        | "piercing"
        | "poison"
        | "psychic"
        | "radiant"
        | "slashing"
        | "thunder"
      effect_tick_timing: "start" | "end" | "round"
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
      ability_score: ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
      damage_type: [
        "acid",
        "bludgeoning",
        "cold",
        "fire",
        "force",
        "lightning",
        "necrotic",
        "piercing",
        "poison",
        "psychic",
        "radiant",
        "slashing",
        "thunder",
      ],
      effect_tick_timing: ["start", "end", "round"],
    },
  },
} as const
