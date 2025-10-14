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
      character_conditions: {
        Row: {
          character_id: string
          condition: Database["public"]["Enums"]["condition_type"]
          created_at: string | null
          encounter_id: string
          ends_at_round: number | null
          id: string
          source_effect_id: string | null
          updated_at: string | null
        }
        Insert: {
          character_id: string
          condition: Database["public"]["Enums"]["condition_type"]
          created_at?: string | null
          encounter_id: string
          ends_at_round?: number | null
          id?: string
          source_effect_id?: string | null
          updated_at?: string | null
        }
        Update: {
          character_id?: string
          condition?: Database["public"]["Enums"]["condition_type"]
          created_at?: string | null
          encounter_id?: string
          ends_at_round?: number | null
          id?: string
          source_effect_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_conditions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_conditions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_conditions_source_effect_id_fkey"
            columns: ["source_effect_id"]
            isOneToOne: false
            referencedRelation: "effects"
            referencedColumns: ["id"]
          },
        ]
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
          initiative_bonus: number
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
          initiative_bonus?: number
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
          initiative_bonus?: number
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
          amount: number | null
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
          amount?: number | null
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
          amount?: number | null
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
      encounter_monsters: {
        Row: {
          abilities: Json
          ac: number
          actions: Json | null
          created_at: string | null
          display_name: string
          encounter_id: string
          group_key: string
          hp_current: number
          hp_max: number
          id: string
          immunities: Json | null
          initiative: number
          initiative_bonus: number
          is_current_turn: boolean | null
          languages: string | null
          legendary_actions: Json | null
          name: string
          order_tiebreak: number
          reactions: Json | null
          resistances: Json | null
          saves: Json | null
          senses: Json | null
          size: Database["public"]["Enums"]["monster_size"]
          skills: Json | null
          source_monster_id: string
          source_type: Database["public"]["Enums"]["monster_source_type"]
          speed: Json
          traits: Json | null
          type: string
          updated_at: string | null
          vulnerabilities: Json | null
        }
        Insert: {
          abilities: Json
          ac: number
          actions?: Json | null
          created_at?: string | null
          display_name: string
          encounter_id: string
          group_key: string
          hp_current: number
          hp_max: number
          id?: string
          immunities?: Json | null
          initiative?: number
          initiative_bonus?: number
          is_current_turn?: boolean | null
          languages?: string | null
          legendary_actions?: Json | null
          name: string
          order_tiebreak?: number
          reactions?: Json | null
          resistances?: Json | null
          saves?: Json | null
          senses?: Json | null
          size: Database["public"]["Enums"]["monster_size"]
          skills?: Json | null
          source_monster_id: string
          source_type: Database["public"]["Enums"]["monster_source_type"]
          speed?: Json
          traits?: Json | null
          type: string
          updated_at?: string | null
          vulnerabilities?: Json | null
        }
        Update: {
          abilities?: Json
          ac?: number
          actions?: Json | null
          created_at?: string | null
          display_name?: string
          encounter_id?: string
          group_key?: string
          hp_current?: number
          hp_max?: number
          id?: string
          immunities?: Json | null
          initiative?: number
          initiative_bonus?: number
          is_current_turn?: boolean | null
          languages?: string | null
          legendary_actions?: Json | null
          name?: string
          order_tiebreak?: number
          reactions?: Json | null
          resistances?: Json | null
          saves?: Json | null
          senses?: Json | null
          size?: Database["public"]["Enums"]["monster_size"]
          skills?: Json | null
          source_monster_id?: string
          source_type?: Database["public"]["Enums"]["monster_source_type"]
          speed?: Json
          traits?: Json | null
          type?: string
          updated_at?: string | null
          vulnerabilities?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "encounter_monsters_encounter_id_fkey"
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
          combatant_type: string
          created_at: string | null
          dex_modifier: number | null
          encounter_id: string | null
          id: string
          initiative_roll: number
          is_current_turn: boolean | null
          passive_perception: number | null
        }
        Insert: {
          character_id?: string | null
          combatant_type?: string
          created_at?: string | null
          dex_modifier?: number | null
          encounter_id?: string | null
          id?: string
          initiative_roll: number
          is_current_turn?: boolean | null
          passive_perception?: number | null
        }
        Update: {
          character_id?: string | null
          combatant_type?: string
          created_at?: string | null
          dex_modifier?: number | null
          encounter_id?: string | null
          id?: string
          initiative_roll?: number
          is_current_turn?: boolean | null
          passive_perception?: number | null
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
      monster_catalog: {
        Row: {
          abilities: Json
          ac: number
          actions: Json | null
          alignment: string | null
          cr: number | null
          created_at: string | null
          hp_avg: number
          hp_formula: string | null
          id: string
          immunities: Json | null
          lair_actions: Json | null
          languages: string | null
          legendary_actions: Json | null
          name: string
          proficiency_bonus: number
          reactions: Json | null
          resistances: Json | null
          saves: Json | null
          senses: Json | null
          size: Database["public"]["Enums"]["monster_size"]
          skills: Json | null
          source: string
          speed: Json
          traits: Json | null
          type: string
          updated_at: string | null
          vulnerabilities: Json | null
        }
        Insert: {
          abilities?: Json
          ac: number
          actions?: Json | null
          alignment?: string | null
          cr?: number | null
          created_at?: string | null
          hp_avg: number
          hp_formula?: string | null
          id?: string
          immunities?: Json | null
          lair_actions?: Json | null
          languages?: string | null
          legendary_actions?: Json | null
          name: string
          proficiency_bonus?: number
          reactions?: Json | null
          resistances?: Json | null
          saves?: Json | null
          senses?: Json | null
          size: Database["public"]["Enums"]["monster_size"]
          skills?: Json | null
          source?: string
          speed?: Json
          traits?: Json | null
          type: string
          updated_at?: string | null
          vulnerabilities?: Json | null
        }
        Update: {
          abilities?: Json
          ac?: number
          actions?: Json | null
          alignment?: string | null
          cr?: number | null
          created_at?: string | null
          hp_avg?: number
          hp_formula?: string | null
          id?: string
          immunities?: Json | null
          lair_actions?: Json | null
          languages?: string | null
          legendary_actions?: Json | null
          name?: string
          proficiency_bonus?: number
          reactions?: Json | null
          resistances?: Json | null
          saves?: Json | null
          senses?: Json | null
          size?: Database["public"]["Enums"]["monster_size"]
          skills?: Json | null
          source?: string
          speed?: Json
          traits?: Json | null
          type?: string
          updated_at?: string | null
          vulnerabilities?: Json | null
        }
        Relationships: []
      }
      monster_homebrew: {
        Row: {
          abilities: Json
          ac: number
          actions: Json | null
          alignment: string | null
          campaign_id: string | null
          cr: number | null
          created_at: string | null
          hp_avg: number
          hp_formula: string | null
          id: string
          immunities: Json | null
          is_published: boolean | null
          lair_actions: Json | null
          languages: string | null
          legendary_actions: Json | null
          name: string
          owner_user_id: string
          proficiency_bonus: number
          reactions: Json | null
          resistances: Json | null
          saves: Json | null
          senses: Json | null
          size: Database["public"]["Enums"]["monster_size"]
          skills: Json | null
          speed: Json
          traits: Json | null
          type: string
          updated_at: string | null
          vulnerabilities: Json | null
        }
        Insert: {
          abilities?: Json
          ac: number
          actions?: Json | null
          alignment?: string | null
          campaign_id?: string | null
          cr?: number | null
          created_at?: string | null
          hp_avg: number
          hp_formula?: string | null
          id?: string
          immunities?: Json | null
          is_published?: boolean | null
          lair_actions?: Json | null
          languages?: string | null
          legendary_actions?: Json | null
          name: string
          owner_user_id: string
          proficiency_bonus?: number
          reactions?: Json | null
          resistances?: Json | null
          saves?: Json | null
          senses?: Json | null
          size: Database["public"]["Enums"]["monster_size"]
          skills?: Json | null
          speed?: Json
          traits?: Json | null
          type: string
          updated_at?: string | null
          vulnerabilities?: Json | null
        }
        Update: {
          abilities?: Json
          ac?: number
          actions?: Json | null
          alignment?: string | null
          campaign_id?: string | null
          cr?: number | null
          created_at?: string | null
          hp_avg?: number
          hp_formula?: string | null
          id?: string
          immunities?: Json | null
          is_published?: boolean | null
          lair_actions?: Json | null
          languages?: string | null
          legendary_actions?: Json | null
          name?: string
          owner_user_id?: string
          proficiency_bonus?: number
          reactions?: Json | null
          resistances?: Json | null
          saves?: Json | null
          senses?: Json | null
          size?: Database["public"]["Enums"]["monster_size"]
          skills?: Json | null
          speed?: Json
          traits?: Json | null
          type?: string
          updated_at?: string | null
          vulnerabilities?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "monster_homebrew_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
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
          advantage_mode: Database["public"]["Enums"]["advantage_mode_enum"]
          created_at: string | null
          dc: number
          description: string
          encounter_id: string | null
          expected_responses: number | null
          expires_at: string | null
          half_on_success: boolean | null
          id: string
          received_responses: number | null
          status: Database["public"]["Enums"]["save_prompt_status"]
          target_character_ids: string[] | null
          target_scope: Database["public"]["Enums"]["target_scope_enum"]
        }
        Insert: {
          ability: Database["public"]["Enums"]["ability_score"]
          advantage_mode?: Database["public"]["Enums"]["advantage_mode_enum"]
          created_at?: string | null
          dc: number
          description: string
          encounter_id?: string | null
          expected_responses?: number | null
          expires_at?: string | null
          half_on_success?: boolean | null
          id?: string
          received_responses?: number | null
          status?: Database["public"]["Enums"]["save_prompt_status"]
          target_character_ids?: string[] | null
          target_scope?: Database["public"]["Enums"]["target_scope_enum"]
        }
        Update: {
          ability?: Database["public"]["Enums"]["ability_score"]
          advantage_mode?: Database["public"]["Enums"]["advantage_mode_enum"]
          created_at?: string | null
          dc?: number
          description?: string
          encounter_id?: string | null
          expected_responses?: number | null
          expires_at?: string | null
          half_on_success?: boolean | null
          id?: string
          received_responses?: number | null
          status?: Database["public"]["Enums"]["save_prompt_status"]
          target_character_ids?: string[] | null
          target_scope?: Database["public"]["Enums"]["target_scope_enum"]
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
      compute_save_prompt_targets: {
        Args: {
          _encounter_id: string
          _target_character_ids: string[]
          _target_scope: Database["public"]["Enums"]["target_scope_enum"]
        }
        Returns: string[]
      }
      is_campaign_member: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ability_score: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA"
      advantage_mode_enum: "normal" | "advantage" | "disadvantage"
      condition_type:
        | "blinded"
        | "charmed"
        | "deafened"
        | "frightened"
        | "grappled"
        | "incapacitated"
        | "invisible"
        | "paralyzed"
        | "petrified"
        | "poisoned"
        | "prone"
        | "restrained"
        | "stunned"
        | "unconscious"
        | "exhaustion_1"
        | "exhaustion_2"
        | "exhaustion_3"
        | "exhaustion_4"
        | "exhaustion_5"
        | "exhaustion_6"
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
      monster_size:
        | "tiny"
        | "small"
        | "medium"
        | "large"
        | "huge"
        | "gargantuan"
      monster_source_type: "catalog" | "homebrew"
      save_prompt_status: "active" | "resolved" | "expired"
      target_scope_enum: "party" | "all" | "custom"
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
      advantage_mode_enum: ["normal", "advantage", "disadvantage"],
      condition_type: [
        "blinded",
        "charmed",
        "deafened",
        "frightened",
        "grappled",
        "incapacitated",
        "invisible",
        "paralyzed",
        "petrified",
        "poisoned",
        "prone",
        "restrained",
        "stunned",
        "unconscious",
        "exhaustion_1",
        "exhaustion_2",
        "exhaustion_3",
        "exhaustion_4",
        "exhaustion_5",
        "exhaustion_6",
      ],
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
      monster_size: ["tiny", "small", "medium", "large", "huge", "gargantuan"],
      monster_source_type: ["catalog", "homebrew"],
      save_prompt_status: ["active", "resolved", "expired"],
      target_scope_enum: ["party", "all", "custom"],
    },
  },
} as const
