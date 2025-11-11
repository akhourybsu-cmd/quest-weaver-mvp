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
      analytics_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          encounter_id: string | null
          error_message: string | null
          event_data: Json | null
          event_type: string
          id: string
          latency_ms: number | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          encounter_id?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          latency_ms?: number | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          encounter_id?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          latency_ms?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
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
      campaign_members: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_pitch: {
        Row: {
          campaign_id: string
          created_at: string | null
          house_rules: string | null
          id: string
          pitch_text: string | null
          player_expectations: Json | null
          safety_tools: Json | null
          session_zero_completed: boolean | null
          themes: string[] | null
          tone: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          house_rules?: string | null
          id?: string
          pitch_text?: string | null
          player_expectations?: Json | null
          safety_tools?: Json | null
          session_zero_completed?: boolean | null
          themes?: string[] | null
          tone?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          house_rules?: string | null
          id?: string
          pitch_text?: string | null
          player_expectations?: Json | null
          safety_tools?: Json | null
          session_zero_completed?: boolean | null
          themes?: string[] | null
          tone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_pitch_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_weather: {
        Row: {
          campaign_id: string
          created_at: string | null
          effects: Json | null
          ended_at: string | null
          id: string
          started_at: string | null
          temperature: string | null
          weather_type: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          effects?: Json | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          temperature?: string | null
          weather_type: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          effects?: Json | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          temperature?: string | null
          weather_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_weather_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
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
      character_abilities: {
        Row: {
          cha: number
          character_id: string
          con: number
          created_at: string | null
          dex: number
          id: string
          int: number
          method: string
          str: number
          wis: number
        }
        Insert: {
          cha?: number
          character_id: string
          con?: number
          created_at?: string | null
          dex?: number
          id?: string
          int?: number
          method?: string
          str?: number
          wis?: number
        }
        Update: {
          cha?: number
          character_id?: string
          con?: number
          created_at?: string | null
          dex?: number
          id?: string
          int?: number
          method?: string
          str?: number
          wis?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_abilities_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_attacks: {
        Row: {
          ability: string
          attack_bonus: number
          character_id: string
          created_at: string | null
          damage: string
          damage_type: string | null
          id: string
          name: string
          properties: string[] | null
        }
        Insert: {
          ability: string
          attack_bonus: number
          character_id: string
          created_at?: string | null
          damage: string
          damage_type?: string | null
          id?: string
          name: string
          properties?: string[] | null
        }
        Update: {
          ability?: string
          attack_bonus?: number
          character_id?: string
          created_at?: string | null
          damage?: string
          damage_type?: string | null
          id?: string
          name?: string
          properties?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "character_attacks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_class_levels: {
        Row: {
          character_id: string | null
          class_id: string | null
          created_at: string | null
          hit_dice_remaining: number
          hp_gained: number
          id: string
          level: number
          subclass_id: string | null
        }
        Insert: {
          character_id?: string | null
          class_id?: string | null
          created_at?: string | null
          hit_dice_remaining?: number
          hp_gained?: number
          id?: string
          level: number
          subclass_id?: string | null
        }
        Update: {
          character_id?: string | null
          class_id?: string | null
          created_at?: string | null
          hit_dice_remaining?: number
          hp_gained?: number
          id?: string
          level?: number
          subclass_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_class_levels_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_class_levels_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "srd_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_class_levels_subclass_id_fkey"
            columns: ["subclass_id"]
            isOneToOne: false
            referencedRelation: "srd_subclasses"
            referencedColumns: ["id"]
          },
        ]
      }
      character_classes: {
        Row: {
          character_id: string
          class_id: string
          class_level: number
          created_at: string | null
          id: string
          is_primary: boolean | null
          subclass_id: string | null
        }
        Insert: {
          character_id: string
          class_id: string
          class_level?: number
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          subclass_id?: string | null
        }
        Update: {
          character_id?: string
          class_id?: string
          class_level?: number
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          subclass_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_classes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "srd_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_classes_subclass_id_fkey"
            columns: ["subclass_id"]
            isOneToOne: false
            referencedRelation: "srd_subclasses"
            referencedColumns: ["id"]
          },
        ]
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
      character_equipment: {
        Row: {
          attunement_required: boolean | null
          character_id: string
          created_at: string | null
          data: Json | null
          equipped: boolean | null
          equipped_slot: string | null
          id: string
          identified: boolean | null
          is_magical: boolean | null
          item_ref: string
          qty: number | null
          value_gp: number | null
          weight: number | null
        }
        Insert: {
          attunement_required?: boolean | null
          character_id: string
          created_at?: string | null
          data?: Json | null
          equipped?: boolean | null
          equipped_slot?: string | null
          id?: string
          identified?: boolean | null
          is_magical?: boolean | null
          item_ref: string
          qty?: number | null
          value_gp?: number | null
          weight?: number | null
        }
        Update: {
          attunement_required?: boolean | null
          character_id?: string
          created_at?: string | null
          data?: Json | null
          equipped?: boolean | null
          equipped_slot?: string | null
          id?: string
          identified?: boolean | null
          is_magical?: boolean | null
          item_ref?: string
          qty?: number | null
          value_gp?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_equipment_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_feats: {
        Row: {
          character_id: string
          choices: Json | null
          created_at: string | null
          feat_id: string
          id: string
          level_gained: number
        }
        Insert: {
          character_id: string
          choices?: Json | null
          created_at?: string | null
          feat_id: string
          id?: string
          level_gained: number
        }
        Update: {
          character_id?: string
          choices?: Json | null
          created_at?: string | null
          feat_id?: string
          id?: string
          level_gained?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_feats_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_feats_feat_id_fkey"
            columns: ["feat_id"]
            isOneToOne: false
            referencedRelation: "srd_feats"
            referencedColumns: ["id"]
          },
        ]
      }
      character_feature_choices: {
        Row: {
          character_id: string | null
          choice_key: string
          created_at: string | null
          feature_id: string | null
          feature_type: string
          id: string
          level_gained: number
          value_json: Json
        }
        Insert: {
          character_id?: string | null
          choice_key: string
          created_at?: string | null
          feature_id?: string | null
          feature_type: string
          id?: string
          level_gained: number
          value_json: Json
        }
        Update: {
          character_id?: string | null
          choice_key?: string
          created_at?: string | null
          feature_id?: string | null
          feature_type?: string
          id?: string
          level_gained?: number
          value_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "character_feature_choices_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_features: {
        Row: {
          character_id: string
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          level: number
          name: string
          source: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          level: number
          name: string
          source: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          level?: number
          name?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_features_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_languages: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_languages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_level_history: {
        Row: {
          character_id: string
          choices_made: Json | null
          class_id: string
          features_gained: Json | null
          hp_gained: number
          id: string
          leveled_at: string | null
          new_level: number
          previous_level: number
        }
        Insert: {
          character_id: string
          choices_made?: Json | null
          class_id: string
          features_gained?: Json | null
          hp_gained: number
          id?: string
          leveled_at?: string | null
          new_level: number
          previous_level: number
        }
        Update: {
          character_id?: string
          choices_made?: Json | null
          class_id?: string
          features_gained?: Json | null
          hp_gained?: number
          id?: string
          leveled_at?: string | null
          new_level?: number
          previous_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_level_history_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_level_history_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "srd_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      character_proficiencies: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_proficiencies_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_resources: {
        Row: {
          character_id: string | null
          created_at: string | null
          current_value: number
          id: string
          label: string
          max_formula: string | null
          max_value: number
          metadata_json: Json | null
          recharge: string
          resource_key: string
          updated_at: string | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string | null
          current_value?: number
          id?: string
          label: string
          max_formula?: string | null
          max_value?: number
          metadata_json?: Json | null
          recharge: string
          resource_key: string
          updated_at?: string | null
        }
        Update: {
          character_id?: string | null
          created_at?: string | null
          current_value?: number
          id?: string
          label?: string
          max_formula?: string | null
          max_value?: number
          metadata_json?: Json | null
          recharge?: string
          resource_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_resources_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_saves: {
        Row: {
          cha: boolean | null
          character_id: string
          con: boolean | null
          dex: boolean | null
          id: string
          int: boolean | null
          str: boolean | null
          wis: boolean | null
        }
        Insert: {
          cha?: boolean | null
          character_id: string
          con?: boolean | null
          dex?: boolean | null
          id?: string
          int?: boolean | null
          str?: boolean | null
          wis?: boolean | null
        }
        Update: {
          cha?: boolean | null
          character_id?: string
          con?: boolean | null
          dex?: boolean | null
          id?: string
          int?: boolean | null
          str?: boolean | null
          wis?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "character_saves_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_skills: {
        Row: {
          character_id: string
          created_at: string | null
          expertise: boolean | null
          id: string
          proficient: boolean | null
          skill: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          expertise?: boolean | null
          id?: string
          proficient?: boolean | null
          skill: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          expertise?: boolean | null
          id?: string
          proficient?: boolean | null
          skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_skills_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_spell_slots: {
        Row: {
          bonus_slots: number | null
          character_id: string
          id: string
          max_slots: number
          spell_level: number
          updated_at: string | null
          used_slots: number
        }
        Insert: {
          bonus_slots?: number | null
          character_id: string
          id?: string
          max_slots?: number
          spell_level: number
          updated_at?: string | null
          used_slots?: number
        }
        Update: {
          bonus_slots?: number | null
          character_id?: string
          id?: string
          max_slots?: number
          spell_level?: number
          updated_at?: string | null
          used_slots?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_spell_slots_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_spells: {
        Row: {
          can_be_prepared: boolean | null
          character_id: string
          created_at: string | null
          id: string
          is_always_prepared: boolean | null
          is_ritual: boolean | null
          known: boolean | null
          preparation_date: string | null
          prepared: boolean | null
          source: string | null
          spell_id: string
        }
        Insert: {
          can_be_prepared?: boolean | null
          character_id: string
          created_at?: string | null
          id?: string
          is_always_prepared?: boolean | null
          is_ritual?: boolean | null
          known?: boolean | null
          preparation_date?: string | null
          prepared?: boolean | null
          source?: string | null
          spell_id: string
        }
        Update: {
          can_be_prepared?: boolean | null
          character_id?: string
          created_at?: string | null
          id?: string
          is_always_prepared?: boolean | null
          is_ritual?: boolean | null
          known?: boolean | null
          preparation_date?: string | null
          prepared?: boolean | null
          source?: string | null
          spell_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_spells_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_spells_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "srd_spells"
            referencedColumns: ["id"]
          },
        ]
      }
      character_spells_known: {
        Row: {
          character_id: string | null
          created_at: string | null
          id: string
          is_always_prepared: boolean | null
          is_prepared: boolean | null
          learned_at_level: number
          source: string
          spell_id: string | null
          spell_type: string
        }
        Insert: {
          character_id?: string | null
          created_at?: string | null
          id?: string
          is_always_prepared?: boolean | null
          is_prepared?: boolean | null
          learned_at_level: number
          source: string
          spell_id?: string | null
          spell_type: string
        }
        Update: {
          character_id?: string | null
          created_at?: string | null
          id?: string
          is_always_prepared?: boolean | null
          is_prepared?: boolean | null
          learned_at_level?: number
          source?: string
          spell_id?: string | null
          spell_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_spells_known_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          ac: number
          action_used: boolean | null
          age: string | null
          alignment: string | null
          ancestry_id: string | null
          background_id: string | null
          bonds: string | null
          bonus_action_used: boolean | null
          breath_remaining_rounds: number | null
          campaign_id: string | null
          can_cast_rituals: boolean | null
          cha_save: number | null
          class: string
          con_save: number | null
          created_at: string | null
          creation_status: string | null
          crit_range_min: number | null
          current_hp: number
          death_save_fail: number | null
          death_save_success: number | null
          dex_save: number | null
          export_version: string | null
          eyes: string | null
          flaws: string | null
          hair: string | null
          height: string | null
          hit_dice_current: number | null
          hit_dice_total: number | null
          hit_die: string | null
          id: string
          ideals: string | null
          immunities: Database["public"]["Enums"]["damage_type"][] | null
          initiative_bonus: number
          inspiration: boolean | null
          int_save: number | null
          last_exported_at: string | null
          level: number
          luck_points_total: number | null
          luck_points_used: number | null
          max_hp: number
          name: string
          notes: string | null
          passive_insight: number | null
          passive_investigation: number | null
          passive_perception: number | null
          personality_traits: string | null
          portrait_url: string | null
          proficiency_bonus: number
          reaction_used: boolean | null
          resistances: Database["public"]["Enums"]["damage_type"][] | null
          resources: Json | null
          ritual_casting_notes: string | null
          size: string | null
          skin: string | null
          speed: number | null
          spell_ability: string | null
          spell_attack_mod: number | null
          spell_save_dc: number | null
          status: string | null
          str_save: number | null
          subancestry_id: string | null
          subclass_id: string | null
          temp_hp: number | null
          updated_at: string | null
          user_id: string
          vulnerabilities: Database["public"]["Enums"]["damage_type"][] | null
          weight: string | null
          wis_save: number | null
          wizard_state: Json | null
        }
        Insert: {
          ac: number
          action_used?: boolean | null
          age?: string | null
          alignment?: string | null
          ancestry_id?: string | null
          background_id?: string | null
          bonds?: string | null
          bonus_action_used?: boolean | null
          breath_remaining_rounds?: number | null
          campaign_id?: string | null
          can_cast_rituals?: boolean | null
          cha_save?: number | null
          class: string
          con_save?: number | null
          created_at?: string | null
          creation_status?: string | null
          crit_range_min?: number | null
          current_hp: number
          death_save_fail?: number | null
          death_save_success?: number | null
          dex_save?: number | null
          export_version?: string | null
          eyes?: string | null
          flaws?: string | null
          hair?: string | null
          height?: string | null
          hit_dice_current?: number | null
          hit_dice_total?: number | null
          hit_die?: string | null
          id?: string
          ideals?: string | null
          immunities?: Database["public"]["Enums"]["damage_type"][] | null
          initiative_bonus?: number
          inspiration?: boolean | null
          int_save?: number | null
          last_exported_at?: string | null
          level?: number
          luck_points_total?: number | null
          luck_points_used?: number | null
          max_hp: number
          name: string
          notes?: string | null
          passive_insight?: number | null
          passive_investigation?: number | null
          passive_perception?: number | null
          personality_traits?: string | null
          portrait_url?: string | null
          proficiency_bonus: number
          reaction_used?: boolean | null
          resistances?: Database["public"]["Enums"]["damage_type"][] | null
          resources?: Json | null
          ritual_casting_notes?: string | null
          size?: string | null
          skin?: string | null
          speed?: number | null
          spell_ability?: string | null
          spell_attack_mod?: number | null
          spell_save_dc?: number | null
          status?: string | null
          str_save?: number | null
          subancestry_id?: string | null
          subclass_id?: string | null
          temp_hp?: number | null
          updated_at?: string | null
          user_id: string
          vulnerabilities?: Database["public"]["Enums"]["damage_type"][] | null
          weight?: string | null
          wis_save?: number | null
          wizard_state?: Json | null
        }
        Update: {
          ac?: number
          action_used?: boolean | null
          age?: string | null
          alignment?: string | null
          ancestry_id?: string | null
          background_id?: string | null
          bonds?: string | null
          bonus_action_used?: boolean | null
          breath_remaining_rounds?: number | null
          campaign_id?: string | null
          can_cast_rituals?: boolean | null
          cha_save?: number | null
          class?: string
          con_save?: number | null
          created_at?: string | null
          creation_status?: string | null
          crit_range_min?: number | null
          current_hp?: number
          death_save_fail?: number | null
          death_save_success?: number | null
          dex_save?: number | null
          export_version?: string | null
          eyes?: string | null
          flaws?: string | null
          hair?: string | null
          height?: string | null
          hit_dice_current?: number | null
          hit_dice_total?: number | null
          hit_die?: string | null
          id?: string
          ideals?: string | null
          immunities?: Database["public"]["Enums"]["damage_type"][] | null
          initiative_bonus?: number
          inspiration?: boolean | null
          int_save?: number | null
          last_exported_at?: string | null
          level?: number
          luck_points_total?: number | null
          luck_points_used?: number | null
          max_hp?: number
          name?: string
          notes?: string | null
          passive_insight?: number | null
          passive_investigation?: number | null
          passive_perception?: number | null
          personality_traits?: string | null
          portrait_url?: string | null
          proficiency_bonus?: number
          reaction_used?: boolean | null
          resistances?: Database["public"]["Enums"]["damage_type"][] | null
          resources?: Json | null
          ritual_casting_notes?: string | null
          size?: string | null
          skin?: string | null
          speed?: number | null
          spell_ability?: string | null
          spell_attack_mod?: number | null
          spell_save_dc?: number | null
          status?: string | null
          str_save?: number | null
          subancestry_id?: string | null
          subclass_id?: string | null
          temp_hp?: number | null
          updated_at?: string | null
          user_id?: string
          vulnerabilities?: Database["public"]["Enums"]["damage_type"][] | null
          weight?: string | null
          wis_save?: number | null
          wizard_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "srd_ancestries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_background_id_fkey"
            columns: ["background_id"]
            isOneToOne: false
            referencedRelation: "srd_backgrounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_subancestry_id_fkey"
            columns: ["subancestry_id"]
            isOneToOne: false
            referencedRelation: "srd_subancestries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_subclass_id_fkey"
            columns: ["subclass_id"]
            isOneToOne: false
            referencedRelation: "srd_subclasses"
            referencedColumns: ["id"]
          },
        ]
      }
      class_features: {
        Row: {
          choices_json: Json | null
          class_id: string | null
          created_at: string | null
          description: string | null
          grants_json: Json | null
          id: string
          level: number
          name: string
          rules_json: Json | null
          tags: string[] | null
        }
        Insert: {
          choices_json?: Json | null
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          grants_json?: Json | null
          id?: string
          level: number
          name: string
          rules_json?: Json | null
          tags?: string[] | null
        }
        Update: {
          choices_json?: Json | null
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          grants_json?: Json | null
          id?: string
          level?: number
          name?: string
          rules_json?: Json | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "class_features_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "srd_classes"
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
          is_critical_hit: boolean | null
          is_visible_to_players: boolean | null
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
          is_critical_hit?: boolean | null
          is_visible_to_players?: boolean | null
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
          is_critical_hit?: boolean | null
          is_visible_to_players?: boolean | null
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
      combat_modifiers: {
        Row: {
          actor_id: string
          actor_type: string
          cover_type: string | null
          created_at: string
          encounter_id: string
          expires_at: string
          id: string
          modifier_type: string
          source: string
          updated_at: string
        }
        Insert: {
          actor_id: string
          actor_type?: string
          cover_type?: string | null
          created_at?: string
          encounter_id: string
          expires_at?: string
          id?: string
          modifier_type: string
          source: string
          updated_at?: string
        }
        Update: {
          actor_id?: string
          actor_type?: string
          cover_type?: string | null
          created_at?: string
          encounter_id?: string
          expires_at?: string
          id?: string
          modifier_type?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combat_modifiers_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_spells: {
        Row: {
          campaign_id: string
          casting_time: string
          classes: string[] | null
          components: Json | null
          concentration: boolean | null
          created_at: string | null
          created_by: string
          damage_type: string | null
          description: string
          duration: string
          higher_levels: string | null
          id: string
          level: number
          name: string
          range: string
          ritual: boolean | null
          save_type: string | null
          scaling_description: string | null
          scaling_type: string | null
          scaling_value: string | null
          school: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          casting_time: string
          classes?: string[] | null
          components?: Json | null
          concentration?: boolean | null
          created_at?: string | null
          created_by: string
          damage_type?: string | null
          description: string
          duration: string
          higher_levels?: string | null
          id?: string
          level: number
          name: string
          range: string
          ritual?: boolean | null
          save_type?: string | null
          scaling_description?: string | null
          scaling_type?: string | null
          scaling_value?: string | null
          school: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          casting_time?: string
          classes?: string[] | null
          components?: Json | null
          concentration?: boolean | null
          created_at?: string | null
          created_by?: string
          damage_type?: string | null
          description?: string
          duration?: string
          higher_levels?: string | null
          id?: string
          level?: number
          name?: string
          range?: string
          ritual?: boolean | null
          save_type?: string | null
          scaling_description?: string | null
          scaling_type?: string | null
          scaling_value?: string | null
          school?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_spells_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      downtime_activities: {
        Row: {
          activity_type: string
          campaign_id: string
          character_id: string
          completed_at: string | null
          created_at: string | null
          days_completed: number | null
          description: string | null
          id: string
          item_name: string | null
          item_rarity: string | null
          item_type: string | null
          materials_json: Json | null
          started_at: string | null
          total_cost_gp: number | null
          total_days_required: number | null
        }
        Insert: {
          activity_type: string
          campaign_id: string
          character_id: string
          completed_at?: string | null
          created_at?: string | null
          days_completed?: number | null
          description?: string | null
          id?: string
          item_name?: string | null
          item_rarity?: string | null
          item_type?: string | null
          materials_json?: Json | null
          started_at?: string | null
          total_cost_gp?: number | null
          total_days_required?: number | null
        }
        Update: {
          activity_type?: string
          campaign_id?: string
          character_id?: string
          completed_at?: string | null
          created_at?: string | null
          days_completed?: number | null
          description?: string | null
          id?: string
          item_name?: string | null
          item_rarity?: string | null
          item_type?: string | null
          materials_json?: Json | null
          started_at?: string | null
          total_cost_gp?: number | null
          total_days_required?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "downtime_activities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downtime_activities_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
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
          is_hp_visible_to_players: boolean | null
          is_visible_to_players: boolean | null
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
          is_hp_visible_to_players?: boolean | null
          is_visible_to_players?: boolean | null
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
          is_hp_visible_to_players?: boolean | null
          is_visible_to_players?: boolean | null
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
          status: Database["public"]["Enums"]["encounter_status"] | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          current_round?: number | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          status?: Database["public"]["Enums"]["encounter_status"] | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          current_round?: number | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          status?: Database["public"]["Enums"]["encounter_status"] | null
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
      faction_reputation: {
        Row: {
          campaign_id: string
          faction_id: string
          id: string
          last_changed_at: string | null
          notes: string | null
          score: number | null
        }
        Insert: {
          campaign_id: string
          faction_id: string
          id?: string
          last_changed_at?: string | null
          notes?: string | null
          score?: number | null
        }
        Update: {
          campaign_id?: string
          faction_id?: string
          id?: string
          last_changed_at?: string | null
          notes?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faction_reputation_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faction_reputation_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "factions"
            referencedColumns: ["id"]
          },
        ]
      }
      factions: {
        Row: {
          banner_url: string | null
          campaign_id: string
          created_at: string | null
          description: string | null
          id: string
          influence_score: number | null
          motto: string | null
          name: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          campaign_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          influence_score?: number | null
          motto?: string | null
          name: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          influence_score?: number | null
          motto?: string | null
          name?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      feats: {
        Row: {
          created_at: string | null
          description: string
          id: string
          name: string
          prerequisites_json: Json | null
          rules_json: Json | null
          source: string | null
          tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          name: string
          prerequisites_json?: Json | null
          rules_json?: Json | null
          source?: string | null
          tags?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          prerequisites_json?: Json | null
          rules_json?: Json | null
          source?: string | null
          tags?: string[] | null
        }
        Relationships: []
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
      hit_dice_rolls: {
        Row: {
          character_id: string
          con_modifier: number
          created_at: string | null
          dice_rolled: number
          id: string
          rest_type: string
          roll_result: number
          total_healing: number
        }
        Insert: {
          character_id: string
          con_modifier: number
          created_at?: string | null
          dice_rolled: number
          id?: string
          rest_type: string
          roll_result: number
          total_healing: number
        }
        Update: {
          character_id?: string
          con_modifier?: number
          created_at?: string | null
          dice_rolled?: number
          id?: string
          rest_type?: string
          roll_result?: number
          total_healing?: number
        }
        Relationships: [
          {
            foreignKeyName: "hit_dice_rolls_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      holding_events: {
        Row: {
          author_id: string | null
          campaign_id: string
          event_type: string
          from_owner_id: string | null
          from_owner_type: string | null
          id: string
          item_id: string
          occurred_at: string | null
          payload: Json | null
          quantity_delta: number | null
          to_owner_id: string | null
          to_owner_type: string | null
        }
        Insert: {
          author_id?: string | null
          campaign_id: string
          event_type: string
          from_owner_id?: string | null
          from_owner_type?: string | null
          id?: string
          item_id: string
          occurred_at?: string | null
          payload?: Json | null
          quantity_delta?: number | null
          to_owner_id?: string | null
          to_owner_type?: string | null
        }
        Update: {
          author_id?: string | null
          campaign_id?: string
          event_type?: string
          from_owner_id?: string | null
          from_owner_type?: string | null
          id?: string
          item_id?: string
          occurred_at?: string | null
          payload?: Json | null
          quantity_delta?: number | null
          to_owner_id?: string | null
          to_owner_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holding_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings: {
        Row: {
          attuned_to: string | null
          campaign_id: string
          id: string
          is_attuned: boolean | null
          item_id: string | null
          notes: string | null
          owner_id: string | null
          owner_type: string | null
          quantity: number | null
          updated_at: string | null
        }
        Insert: {
          attuned_to?: string | null
          campaign_id: string
          id?: string
          is_attuned?: boolean | null
          item_id?: string | null
          notes?: string | null
          owner_id?: string | null
          owner_type?: string | null
          quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          attuned_to?: string | null
          campaign_id?: string
          id?: string
          is_attuned?: boolean | null
          item_id?: string | null
          notes?: string | null
          owner_id?: string | null
          owner_type?: string | null
          quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holdings_attuned_to_fkey"
            columns: ["attuned_to"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holdings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holdings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative: {
        Row: {
          combatant_id: string | null
          combatant_type: string
          created_at: string | null
          dex_modifier: number | null
          encounter_id: string | null
          has_leveled_spell_this_turn: boolean | null
          id: string
          initiative_roll: number
          is_current_turn: boolean | null
          is_surprised: boolean | null
          leveled_spell_was_bonus_action: boolean | null
          passive_perception: number | null
        }
        Insert: {
          combatant_id?: string | null
          combatant_type?: string
          created_at?: string | null
          dex_modifier?: number | null
          encounter_id?: string | null
          has_leveled_spell_this_turn?: boolean | null
          id?: string
          initiative_roll: number
          is_current_turn?: boolean | null
          is_surprised?: boolean | null
          leveled_spell_was_bonus_action?: boolean | null
          passive_perception?: number | null
        }
        Update: {
          combatant_id?: string | null
          combatant_type?: string
          created_at?: string | null
          dex_modifier?: number | null
          encounter_id?: string | null
          has_leveled_spell_this_turn?: boolean | null
          id?: string
          initiative_roll?: number
          is_current_turn?: boolean | null
          is_surprised?: boolean | null
          leveled_spell_was_bonus_action?: boolean | null
          passive_perception?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "initiative_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      item_links: {
        Row: {
          id: string
          item_id: string
          label: string | null
          link_id: string
          link_type: string
        }
        Insert: {
          id?: string
          item_id: string
          label?: string | null
          link_id: string
          link_type: string
        }
        Update: {
          id?: string
          item_id?: string
          label?: string | null
          link_id?: string
          link_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_links_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          template_data: Json
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          template_data: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          template_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      item_versions: {
        Row: {
          changelog: string | null
          created_at: string | null
          created_by: string | null
          id: string
          item_id: string
          properties: Json
          version_number: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id: string
          properties: Json
          version_number: string
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string
          properties?: Json
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_versions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          campaign_id: string
          created_at: string | null
          description: string | null
          id: string
          identified: boolean | null
          is_component_pouch: boolean | null
          is_focus: boolean | null
          name: string
          properties: Json | null
          rarity: string | null
          source_ref: string | null
          tags: string[] | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          identified?: boolean | null
          is_component_pouch?: boolean | null
          is_focus?: boolean | null
          name: string
          properties?: Json | null
          rarity?: string | null
          source_ref?: string | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          identified?: boolean | null
          is_component_pouch?: boolean | null
          is_focus?: boolean | null
          name?: string
          properties?: Json | null
          rarity?: string | null
          source_ref?: string | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      lingering_injuries: {
        Row: {
          acquired_at: string | null
          character_id: string | null
          created_at: string | null
          description: string
          effects: Json | null
          healed_at: string | null
          id: string
          injury_type: string
          is_permanent: boolean | null
        }
        Insert: {
          acquired_at?: string | null
          character_id?: string | null
          created_at?: string | null
          description: string
          effects?: Json | null
          healed_at?: string | null
          id?: string
          injury_type: string
          is_permanent?: boolean | null
        }
        Update: {
          acquired_at?: string | null
          character_id?: string | null
          created_at?: string | null
          description?: string
          effects?: Json | null
          healed_at?: string | null
          id?: string
          injury_type?: string
          is_permanent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lingering_injuries_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          campaign_id: string
          created_at: string | null
          description: string | null
          id: string
          location_type: string | null
          name: string
          parent_location_id: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          location_type?: string | null
          name: string
          parent_location_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location_type?: string | null
          name?: string
          parent_location_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
      lore_backlinks: {
        Row: {
          campaign_id: string
          created_at: string
          from_id: string
          from_type: string
          id: string
          label: string
          page_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          from_id: string
          from_type: string
          id?: string
          label: string
          page_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          from_id?: string
          from_type?: string
          id?: string
          label?: string
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lore_backlinks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lore_backlinks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "lore_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      lore_links: {
        Row: {
          campaign_id: string
          id: string
          label: string
          source_page: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          campaign_id: string
          id?: string
          label: string
          source_page: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          campaign_id?: string
          id?: string
          label?: string
          source_page?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lore_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lore_links_source_page_fkey"
            columns: ["source_page"]
            isOneToOne: false
            referencedRelation: "lore_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      lore_pages: {
        Row: {
          author_id: string | null
          campaign_id: string
          category: string
          content_md: string
          created_at: string
          details: Json | null
          era: string | null
          excerpt: string | null
          id: string
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id?: string | null
          campaign_id: string
          category?: string
          content_md: string
          created_at?: string
          details?: Json | null
          era?: string | null
          excerpt?: string | null
          id?: string
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string | null
          campaign_id?: string
          category?: string
          content_md?: string
          created_at?: string
          details?: Json | null
          era?: string | null
          excerpt?: string | null
          id?: string
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "lore_pages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
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
          slug: string | null
          source: string
          speed: Json
          spell_save_dc_summary: Json | null
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
          slug?: string | null
          source?: string
          speed?: Json
          spell_save_dc_summary?: Json | null
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
          slug?: string | null
          source?: string
          speed?: Json
          spell_save_dc_summary?: Json | null
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
      mount_rider_pairs: {
        Row: {
          created_at: string | null
          encounter_id: string
          id: string
          is_controlled: boolean | null
          mount_character_id: string | null
          mount_monster_id: string | null
          mounted_at_round: number
          rider_character_id: string | null
          rider_monster_id: string | null
        }
        Insert: {
          created_at?: string | null
          encounter_id: string
          id?: string
          is_controlled?: boolean | null
          mount_character_id?: string | null
          mount_monster_id?: string | null
          mounted_at_round: number
          rider_character_id?: string | null
          rider_monster_id?: string | null
        }
        Update: {
          created_at?: string | null
          encounter_id?: string
          id?: string
          is_controlled?: boolean | null
          mount_character_id?: string | null
          mount_monster_id?: string | null
          mounted_at_round?: number
          rider_character_id?: string | null
          rider_monster_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mount_rider_pairs_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mount_rider_pairs_mount_character_id_fkey"
            columns: ["mount_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mount_rider_pairs_mount_monster_id_fkey"
            columns: ["mount_monster_id"]
            isOneToOne: false
            referencedRelation: "encounter_monsters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mount_rider_pairs_rider_character_id_fkey"
            columns: ["rider_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mount_rider_pairs_rider_monster_id_fkey"
            columns: ["rider_monster_id"]
            isOneToOne: false
            referencedRelation: "encounter_monsters"
            referencedColumns: ["id"]
          },
        ]
      }
      note_links: {
        Row: {
          created_at: string | null
          id: string
          label: string
          link_id: string | null
          link_type: string
          note_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          link_id?: string | null
          link_type: string
          note_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          link_id?: string | null
          link_type?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_links_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "session_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      npc_appearances: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          npc_id: string
          session_id: string | null
          summary: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          npc_id: string
          session_id?: string | null
          summary: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          npc_id?: string
          session_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "npc_appearances_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npc_appearances_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npcs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npc_appearances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      npc_relationships: {
        Row: {
          campaign_id: string
          id: string
          intensity: number | null
          notes: string | null
          relation: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          id?: string
          intensity?: number | null
          notes?: string | null
          relation: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          id?: string
          intensity?: number | null
          notes?: string | null
          relation?: string
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "npc_relationships_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      npcs: {
        Row: {
          attitude: string | null
          campaign_id: string
          created_at: string | null
          description: string | null
          faction_id: string | null
          gm_notes: string | null
          id: string
          location: string | null
          location_id: string | null
          name: string
          portrait_url: string | null
          pronouns: string | null
          public_bio: string | null
          role: string | null
          role_title: string | null
          secrets: string | null
          statblock_ref: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          attitude?: string | null
          campaign_id: string
          created_at?: string | null
          description?: string | null
          faction_id?: string | null
          gm_notes?: string | null
          id?: string
          location?: string | null
          location_id?: string | null
          name: string
          portrait_url?: string | null
          pronouns?: string | null
          public_bio?: string | null
          role?: string | null
          role_title?: string | null
          secrets?: string | null
          statblock_ref?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          attitude?: string | null
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          faction_id?: string | null
          gm_notes?: string | null
          id?: string
          location?: string | null
          location_id?: string | null
          name?: string
          portrait_url?: string | null
          pronouns?: string | null
          public_bio?: string | null
          role?: string | null
          role_title?: string | null
          secrets?: string | null
          statblock_ref?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_npcs_faction"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "factions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npcs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npcs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_attacks: {
        Row: {
          attack_result: Json | null
          attacker_id: string
          attacker_type: string
          created_at: string | null
          encounter_id: string
          id: string
          resolved: boolean | null
          target_id: string
          target_type: string
          triggered_at: string | null
        }
        Insert: {
          attack_result?: Json | null
          attacker_id: string
          attacker_type: string
          created_at?: string | null
          encounter_id: string
          id?: string
          resolved?: boolean | null
          target_id: string
          target_type: string
          triggered_at?: string | null
        }
        Update: {
          attack_result?: Json | null
          attacker_id?: string
          attacker_type?: string
          created_at?: string | null
          encounter_id?: string
          id?: string
          resolved?: boolean | null
          target_id?: string
          target_type?: string
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_attacks_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
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
      player_turn_signals: {
        Row: {
          acknowledged_by_dm: boolean | null
          character_id: string
          created_at: string
          encounter_id: string
          id: string
          message: string | null
          signal_type: string
        }
        Insert: {
          acknowledged_by_dm?: boolean | null
          character_id: string
          created_at?: string
          encounter_id: string
          id?: string
          message?: string | null
          signal_type: string
        }
        Update: {
          acknowledged_by_dm?: boolean | null
          character_id?: string
          created_at?: string
          encounter_id?: string
          id?: string
          message?: string | null
          signal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_turn_signals_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_turn_signals_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_steps: {
        Row: {
          created_at: string | null
          description: string
          encounter_id: string | null
          id: string
          is_completed: boolean | null
          location: string | null
          notes: string | null
          npc_id: string | null
          objective_type: string | null
          parent_step_id: string | null
          progress_current: number | null
          progress_max: number | null
          quest_id: string
          step_order: number
        }
        Insert: {
          created_at?: string | null
          description: string
          encounter_id?: string | null
          id?: string
          is_completed?: boolean | null
          location?: string | null
          notes?: string | null
          npc_id?: string | null
          objective_type?: string | null
          parent_step_id?: string | null
          progress_current?: number | null
          progress_max?: number | null
          quest_id: string
          step_order: number
        }
        Update: {
          created_at?: string | null
          description?: string
          encounter_id?: string | null
          id?: string
          is_completed?: boolean | null
          location?: string | null
          notes?: string | null
          npc_id?: string | null
          objective_type?: string | null
          parent_step_id?: string | null
          progress_current?: number | null
          progress_max?: number | null
          quest_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_steps_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_steps_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npcs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_steps_parent_step_id_fkey"
            columns: ["parent_step_id"]
            isOneToOne: false
            referencedRelation: "quest_steps"
            referencedColumns: ["id"]
          },
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
          assigned_to: string[] | null
          campaign_id: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          dm_notes: string | null
          faction_id: string | null
          id: string
          is_completed: boolean | null
          locations: string[] | null
          quest_chain_parent: string | null
          quest_giver: string | null
          quest_type: string | null
          reward_gp: number | null
          reward_items: Json | null
          reward_xp: number | null
          session_notes: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string[] | null
          campaign_id: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          dm_notes?: string | null
          faction_id?: string | null
          id?: string
          is_completed?: boolean | null
          locations?: string[] | null
          quest_chain_parent?: string | null
          quest_giver?: string | null
          quest_type?: string | null
          reward_gp?: number | null
          reward_items?: Json | null
          reward_xp?: number | null
          session_notes?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string[] | null
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          dm_notes?: string | null
          faction_id?: string | null
          id?: string
          is_completed?: boolean | null
          locations?: string[] | null
          quest_chain_parent?: string | null
          quest_giver?: string | null
          quest_type?: string | null
          reward_gp?: number | null
          reward_items?: Json | null
          reward_xp?: number | null
          session_notes?: string | null
          status?: string | null
          tags?: string[] | null
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
          {
            foreignKeyName: "quests_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "factions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_quest_chain_parent_fkey"
            columns: ["quest_chain_parent"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      readied_actions: {
        Row: {
          action_description: string
          character_id: string | null
          created_at: string | null
          encounter_id: string
          expires_at_round: number
          id: string
          monster_id: string | null
          trigger_condition: string
        }
        Insert: {
          action_description: string
          character_id?: string | null
          created_at?: string | null
          encounter_id: string
          expires_at_round: number
          id?: string
          monster_id?: string | null
          trigger_condition: string
        }
        Update: {
          action_description?: string
          character_id?: string | null
          created_at?: string | null
          encounter_id?: string
          expires_at_round?: number
          id?: string
          monster_id?: string | null
          trigger_condition?: string
        }
        Relationships: [
          {
            foreignKeyName: "readied_actions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "readied_actions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "readied_actions_monster_id_fkey"
            columns: ["monster_id"]
            isOneToOne: false
            referencedRelation: "encounter_monsters"
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
      session_highlights: {
        Row: {
          campaign_id: string
          color: string | null
          created_at: string | null
          id: string
          session_id: string | null
          text: string
        }
        Insert: {
          campaign_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          text: string
        }
        Update: {
          campaign_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_highlights_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_highlights_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes: {
        Row: {
          author_id: string
          campaign_id: string
          content: Json | null
          content_markdown: string | null
          created_at: string | null
          id: string
          is_pinned: boolean | null
          session_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          author_id: string
          campaign_id: string
          content?: Json | null
          content_markdown?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          session_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          author_id?: string
          campaign_id?: string
          content?: Json | null
          content_markdown?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          session_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          session_date: string | null
          session_number: number
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          session_date?: string | null
          session_number: number
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          session_date?: string | null
          session_number?: number
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_casting_history: {
        Row: {
          cast_at: string | null
          character_id: string
          custom_spell_id: string | null
          encounter_id: string | null
          id: string
          spell_id: string | null
          spell_level_cast: number
          target_info: Json | null
          was_ritual: boolean | null
          was_upcast: boolean | null
        }
        Insert: {
          cast_at?: string | null
          character_id: string
          custom_spell_id?: string | null
          encounter_id?: string | null
          id?: string
          spell_id?: string | null
          spell_level_cast: number
          target_info?: Json | null
          was_ritual?: boolean | null
          was_upcast?: boolean | null
        }
        Update: {
          cast_at?: string | null
          character_id?: string
          custom_spell_id?: string | null
          encounter_id?: string | null
          id?: string
          spell_id?: string | null
          spell_level_cast?: number
          target_info?: Json | null
          was_ritual?: boolean | null
          was_upcast?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_casting_history_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_casting_history_custom_spell_id_fkey"
            columns: ["custom_spell_id"]
            isOneToOne: false
            referencedRelation: "custom_spells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_casting_history_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_preparation_sessions: {
        Row: {
          character_id: string
          id: string
          notes: string | null
          prepared_at: string | null
          spell_ids: string[] | null
        }
        Insert: {
          character_id: string
          id?: string
          notes?: string | null
          prepared_at?: string | null
          spell_ids?: string[] | null
        }
        Update: {
          character_id?: string
          id?: string
          notes?: string | null
          prepared_at?: string | null
          spell_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_preparation_sessions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      spellbook_entries: {
        Row: {
          added_at: string | null
          character_id: string
          cost_paid: number | null
          custom_spell_id: string | null
          id: string
          learned_at_level: number | null
          notes: string | null
          spell_id: string | null
        }
        Insert: {
          added_at?: string | null
          character_id: string
          cost_paid?: number | null
          custom_spell_id?: string | null
          id?: string
          learned_at_level?: number | null
          notes?: string | null
          spell_id?: string | null
        }
        Update: {
          added_at?: string | null
          character_id?: string
          cost_paid?: number | null
          custom_spell_id?: string | null
          id?: string
          learned_at_level?: number | null
          notes?: string | null
          spell_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spellbook_entries_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spellbook_entries_custom_spell_id_fkey"
            columns: ["custom_spell_id"]
            isOneToOne: false
            referencedRelation: "custom_spells"
            referencedColumns: ["id"]
          },
        ]
      }
      srd_ancestries: {
        Row: {
          ability_bonuses: Json
          created_at: string | null
          id: string
          languages: Json
          name: string
          options: Json
          proficiencies: Json
          size: string
          speed: number
          traits: Json
        }
        Insert: {
          ability_bonuses?: Json
          created_at?: string | null
          id?: string
          languages?: Json
          name: string
          options?: Json
          proficiencies?: Json
          size: string
          speed?: number
          traits?: Json
        }
        Update: {
          ability_bonuses?: Json
          created_at?: string | null
          id?: string
          languages?: Json
          name?: string
          options?: Json
          proficiencies?: Json
          size?: string
          speed?: number
          traits?: Json
        }
        Relationships: []
      }
      srd_armor: {
        Row: {
          base_ac: number
          category: string
          cost_gp: number | null
          created_at: string | null
          dex_cap: number | null
          id: string
          name: string
          stealth_disadv: boolean | null
          strength_min: number | null
          weight: number | null
        }
        Insert: {
          base_ac: number
          category: string
          cost_gp?: number | null
          created_at?: string | null
          dex_cap?: number | null
          id?: string
          name: string
          stealth_disadv?: boolean | null
          strength_min?: number | null
          weight?: number | null
        }
        Update: {
          base_ac?: number
          category?: string
          cost_gp?: number | null
          created_at?: string | null
          dex_cap?: number | null
          id?: string
          name?: string
          stealth_disadv?: boolean | null
          strength_min?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      srd_backgrounds: {
        Row: {
          created_at: string | null
          equipment: Json
          feature: string | null
          id: string
          languages: Json
          name: string
          skill_proficiencies: Json
          tool_proficiencies: Json
        }
        Insert: {
          created_at?: string | null
          equipment?: Json
          feature?: string | null
          id?: string
          languages?: Json
          name: string
          skill_proficiencies?: Json
          tool_proficiencies?: Json
        }
        Update: {
          created_at?: string | null
          equipment?: Json
          feature?: string | null
          id?: string
          languages?: Json
          name?: string
          skill_proficiencies?: Json
          tool_proficiencies?: Json
        }
        Relationships: []
      }
      srd_class_features: {
        Row: {
          choices: Json | null
          class_id: string
          created_at: string | null
          description: string
          id: string
          level: number
          name: string
        }
        Insert: {
          choices?: Json | null
          class_id: string
          created_at?: string | null
          description: string
          id?: string
          level: number
          name: string
        }
        Update: {
          choices?: Json | null
          class_id?: string
          created_at?: string | null
          description?: string
          id?: string
          level?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "srd_class_features_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "srd_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      srd_classes: {
        Row: {
          created_at: string | null
          hit_die: number
          id: string
          name: string
          proficiencies: Json
          saving_throws: string[]
          spellcasting_ability: string | null
          spellcasting_progression: string | null
          starting_equipment: Json
        }
        Insert: {
          created_at?: string | null
          hit_die: number
          id?: string
          name: string
          proficiencies?: Json
          saving_throws?: string[]
          spellcasting_ability?: string | null
          spellcasting_progression?: string | null
          starting_equipment?: Json
        }
        Update: {
          created_at?: string | null
          hit_die?: number
          id?: string
          name?: string
          proficiencies?: Json
          saving_throws?: string[]
          spellcasting_ability?: string | null
          spellcasting_progression?: string | null
          starting_equipment?: Json
        }
        Relationships: []
      }
      srd_conditions: {
        Row: {
          created_at: string | null
          description: string | null
          document: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      srd_documents: {
        Row: {
          author: string | null
          created_at: string | null
          description: string | null
          id: string
          slug: string | null
          title: string
          version: string | null
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          slug?: string | null
          title: string
          version?: string | null
        }
        Update: {
          author?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          slug?: string | null
          title?: string
          version?: string | null
        }
        Relationships: []
      }
      srd_equipment: {
        Row: {
          cost_gp: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          properties: Json | null
          type: string
          weight: number | null
        }
        Insert: {
          cost_gp?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          properties?: Json | null
          type: string
          weight?: number | null
        }
        Update: {
          cost_gp?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          properties?: Json | null
          type?: string
          weight?: number | null
        }
        Relationships: []
      }
      srd_feats: {
        Row: {
          ability_increases: Json | null
          created_at: string | null
          description: string | null
          grants: Json | null
          id: string
          name: string
          prerequisites: Json | null
        }
        Insert: {
          ability_increases?: Json | null
          created_at?: string | null
          description?: string | null
          grants?: Json | null
          id?: string
          name: string
          prerequisites?: Json | null
        }
        Update: {
          ability_increases?: Json | null
          created_at?: string | null
          description?: string | null
          grants?: Json | null
          id?: string
          name?: string
          prerequisites?: Json | null
        }
        Relationships: []
      }
      srd_languages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          script: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          script?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          script?: string | null
        }
        Relationships: []
      }
      srd_magic_items: {
        Row: {
          created_at: string | null
          description: string | null
          document: string | null
          id: string
          name: string
          rarity: string | null
          requires_attunement: boolean | null
          slug: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document?: string | null
          id?: string
          name: string
          rarity?: string | null
          requires_attunement?: boolean | null
          slug?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document?: string | null
          id?: string
          name?: string
          rarity?: string | null
          requires_attunement?: boolean | null
          slug?: string | null
          type?: string | null
        }
        Relationships: []
      }
      srd_planes: {
        Row: {
          created_at: string | null
          description: string | null
          document: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      srd_sections: {
        Row: {
          created_at: string | null
          description: string | null
          document: string | null
          id: string
          name: string
          parent: string | null
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document?: string | null
          id?: string
          name: string
          parent?: string | null
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document?: string | null
          id?: string
          name?: string
          parent?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      srd_spell_classes: {
        Row: {
          class_slug: string
          id: string
          level: number
          spell_slug: string
        }
        Insert: {
          class_slug: string
          id?: string
          level: number
          spell_slug: string
        }
        Update: {
          class_slug?: string
          id?: string
          level?: number
          spell_slug?: string
        }
        Relationships: []
      }
      srd_spell_slots: {
        Row: {
          class_id: string
          level: number
          slot_array: number[]
        }
        Insert: {
          class_id: string
          level: number
          slot_array?: number[]
        }
        Update: {
          class_id?: string
          level?: number
          slot_array?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "srd_spell_slots_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "srd_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      srd_spells: {
        Row: {
          casting_time: string
          classes: string[]
          components: string[]
          concentration: boolean | null
          created_at: string | null
          description: string
          duration: string
          higher_levels: string | null
          id: string
          level: number
          material: string | null
          name: string
          range: string
          ritual: boolean | null
          scaling_description: string | null
          scaling_type: string | null
          scaling_value: string | null
          school: string
        }
        Insert: {
          casting_time: string
          classes?: string[]
          components?: string[]
          concentration?: boolean | null
          created_at?: string | null
          description: string
          duration: string
          higher_levels?: string | null
          id?: string
          level: number
          material?: string | null
          name: string
          range: string
          ritual?: boolean | null
          scaling_description?: string | null
          scaling_type?: string | null
          scaling_value?: string | null
          school: string
        }
        Update: {
          casting_time?: string
          classes?: string[]
          components?: string[]
          concentration?: boolean | null
          created_at?: string | null
          description?: string
          duration?: string
          higher_levels?: string | null
          id?: string
          level?: number
          material?: string | null
          name?: string
          range?: string
          ritual?: boolean | null
          scaling_description?: string | null
          scaling_type?: string | null
          scaling_value?: string | null
          school?: string
        }
        Relationships: []
      }
      srd_subancestries: {
        Row: {
          ability_bonuses: Json
          ancestry_id: string
          created_at: string | null
          id: string
          name: string
          options: Json
          traits: Json
        }
        Insert: {
          ability_bonuses?: Json
          ancestry_id: string
          created_at?: string | null
          id?: string
          name: string
          options?: Json
          traits?: Json
        }
        Update: {
          ability_bonuses?: Json
          ancestry_id?: string
          created_at?: string | null
          id?: string
          name?: string
          options?: Json
          traits?: Json
        }
        Relationships: [
          {
            foreignKeyName: "srd_subancestries_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "srd_ancestries"
            referencedColumns: ["id"]
          },
        ]
      }
      srd_subclass_features: {
        Row: {
          choices: Json | null
          created_at: string | null
          description: string
          id: string
          level: number
          name: string
          subclass_id: string
        }
        Insert: {
          choices?: Json | null
          created_at?: string | null
          description: string
          id?: string
          level: number
          name: string
          subclass_id: string
        }
        Update: {
          choices?: Json | null
          created_at?: string | null
          description?: string
          id?: string
          level?: number
          name?: string
          subclass_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "srd_subclass_features_subclass_id_fkey"
            columns: ["subclass_id"]
            isOneToOne: false
            referencedRelation: "srd_subclasses"
            referencedColumns: ["id"]
          },
        ]
      }
      srd_subclasses: {
        Row: {
          class_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          unlock_level: number
        }
        Insert: {
          class_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          unlock_level?: number
        }
        Update: {
          class_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          unlock_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "srd_subclasses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "srd_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      srd_tools: {
        Row: {
          category: string
          cost_gp: number | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          cost_gp?: number | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          cost_gp?: number | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      srd_weapons: {
        Row: {
          category: string
          cost_gp: number | null
          created_at: string | null
          damage: string
          damage_type: string
          id: string
          name: string
          properties: string[] | null
          weight: number | null
        }
        Insert: {
          category: string
          cost_gp?: number | null
          created_at?: string | null
          damage: string
          damage_type: string
          id?: string
          name: string
          properties?: string[] | null
          weight?: number | null
        }
        Update: {
          category?: string
          cost_gp?: number | null
          created_at?: string | null
          damage?: string
          damage_type?: string
          id?: string
          name?: string
          properties?: string[] | null
          weight?: number | null
        }
        Relationships: []
      }
      subclass_features: {
        Row: {
          choices_json: Json | null
          created_at: string | null
          description: string | null
          grants_json: Json | null
          id: string
          level: number
          name: string
          rules_json: Json | null
          subclass_id: string | null
          tags: string[] | null
        }
        Insert: {
          choices_json?: Json | null
          created_at?: string | null
          description?: string | null
          grants_json?: Json | null
          id?: string
          level: number
          name: string
          rules_json?: Json | null
          subclass_id?: string | null
          tags?: string[] | null
        }
        Update: {
          choices_json?: Json | null
          created_at?: string | null
          description?: string | null
          grants_json?: Json | null
          id?: string
          level?: number
          name?: string
          rules_json?: Json | null
          subclass_id?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "subclass_features_subclass_id_fkey"
            columns: ["subclass_id"]
            isOneToOne: false
            referencedRelation: "srd_subclasses"
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      auth_role_in_campaign: { Args: { camp_id: string }; Returns: string }
      character_owned_by_user: { Args: { char_id: string }; Returns: boolean }
      compute_save_prompt_targets: {
        Args: {
          _encounter_id: string
          _target_character_ids: string[]
          _target_scope: Database["public"]["Enums"]["target_scope_enum"]
        }
        Returns: string[]
      }
      create_character_full: { Args: { payload: Json }; Returns: string }
      get_prepared_spell_count: { Args: { char_id: string }; Returns: number }
      get_user_campaign_role: {
        Args: { _campaign_id: string }
        Returns: {
          has_access: boolean
          is_dm: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_campaign_member: {
        Args: { _campaign_id: string; _user_id: string }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      reset_spell_slots: { Args: { char_id: string }; Returns: undefined }
    }
    Enums: {
      ability_score: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA"
      advantage_mode_enum: "normal" | "advantage" | "disadvantage"
      app_role: "admin" | "user"
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
      encounter_status: "preparing" | "active" | "paused" | "ended"
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
      app_role: ["admin", "user"],
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
      encounter_status: ["preparing", "active", "paused", "ended"],
      monster_size: ["tiny", "small", "medium", "large", "huge", "gargantuan"],
      monster_source_type: ["catalog", "homebrew"],
      save_prompt_status: ["active", "resolved", "expired"],
      target_scope_enum: ["party", "all", "custom"],
    },
  },
} as const
