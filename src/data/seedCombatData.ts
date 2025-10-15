/**
 * Seed Data for Development Testing
 * Creates a ready-to-use combat encounter with 4 PCs and 2 monsters
 */

import { supabase } from "@/integrations/supabase/client";

export interface SeedDataResult {
  campaign_id: string;
  encounter_id: string;
  character_ids: string[];
  monster_ids: string[];
}

/**
 * Seeds a development combat encounter
 * Call this from a dev-only button or on first load in dev mode
 */
export async function seedDevelopmentCombat(userId: string): Promise<SeedDataResult | null> {
  try {
    console.log("🌱 Starting seed data creation...");

    // 1. Create a test campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        dm_user_id: userId,
        name: 'DEV: Test Combat Session',
        code: 'DEV001'
      })
      .select()
      .single();

    if (campaignError) throw campaignError;
    console.log("✅ Campaign created:", campaign.id);

    // 2. Create 4 player characters
    const characters = [
      {
        name: 'Bjorn the Bold',
        class: 'Fighter',
        level: 5,
        max_hp: 42,
        current_hp: 42,
        temp_hp: 0,
        ac: 18,
        initiative_bonus: 1,
        passive_perception: 12,
        speed: 30,
        proficiency_bonus: 3,
        str_save: 6, dex_save: 1, con_save: 5, int_save: 0, wis_save: 2, cha_save: 0,
        resistances: [],
        vulnerabilities: [],
        immunities: [],
        user_id: userId,
        campaign_id: campaign.id
      },
      {
        name: 'Elara Moonwhisper',
        class: 'Wizard',
        level: 5,
        max_hp: 28,
        current_hp: 28,
        temp_hp: 0,
        ac: 12,
        initiative_bonus: 3,
        passive_perception: 14,
        speed: 30,
        proficiency_bonus: 3,
        str_save: -1, dex_save: 3, con_save: 2, int_save: 6, wis_save: 4, cha_save: 1,
        resistances: [],
        vulnerabilities: [],
        immunities: [],
        user_id: userId,
        campaign_id: campaign.id
      },
      {
        name: 'Thoren Ironfist',
        class: 'Cleric',
        level: 5,
        max_hp: 38,
        current_hp: 38,
        temp_hp: 0,
        ac: 16,
        initiative_bonus: 0,
        passive_perception: 15,
        speed: 25,
        proficiency_bonus: 3,
        str_save: 3, dex_save: 0, con_save: 2, int_save: 1, wis_save: 6, cha_save: 4,
        resistances: [],
        vulnerabilities: [],
        immunities: [],
        user_id: userId,
        campaign_id: campaign.id
      },
      {
        name: 'Lyra Swiftarrow',
        class: 'Rogue',
        level: 5,
        max_hp: 32,
        current_hp: 32,
        temp_hp: 0,
        ac: 15,
        initiative_bonus: 4,
        passive_perception: 16,
        speed: 30,
        proficiency_bonus: 3,
        str_save: 0, dex_save: 7, con_save: 1, int_save: 4, wis_save: 3, cha_save: 1,
        resistances: [],
        vulnerabilities: [],
        immunities: [],
        user_id: userId,
        campaign_id: campaign.id
      }
    ];

    const { data: createdCharacters, error: charError } = await supabase
      .from('characters')
      .insert(characters)
      .select();

    if (charError) throw charError;
    console.log("✅ Characters created:", createdCharacters.length);

    // 3. Create an active encounter
    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .insert({
        campaign_id: campaign.id,
        name: 'Goblin Ambush',
        current_round: 1,
        is_active: true
      })
      .select()
      .single();

    if (encounterError) throw encounterError;
    console.log("✅ Encounter created:", encounter.id);

    // 4. Add monsters to the encounter
    const monsters = [
      {
        encounter_id: encounter.id,
        source_monster_id: '00000000-0000-0000-0000-000000000001', // placeholder
        source_type: 'catalog' as const,
        name: 'Goblin',
        display_name: 'Goblin 1',
        group_key: 'goblin',
        size: 'small' as const,
        type: 'humanoid',
        ac: 15,
        hp_current: 7,
        hp_max: 7,
        speed: { walk: 30 },
        abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
        initiative: 15,
        initiative_bonus: 2,
        is_current_turn: false,
        order_tiebreak: 0,
        saves: {},
        skills: { stealth: 6 },
        senses: { darkvision: 60 },
        resistances: [],
        vulnerabilities: [],
        immunities: [],
        traits: [{ name: 'Nimble Escape', desc: 'Can take Disengage or Hide as a bonus action.' }],
        actions: [
          { 
            name: 'Scimitar', 
            desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.',
            attack_bonus: 4,
            damage_dice: '1d6',
            damage_bonus: 2
          }
        ],
        reactions: [],
        legendary_actions: [],
        languages: 'Common, Goblin'
      },
      {
        encounter_id: encounter.id,
        source_monster_id: '00000000-0000-0000-0000-000000000001',
        source_type: 'catalog' as const,
        name: 'Goblin',
        display_name: 'Goblin 2',
        group_key: 'goblin',
        size: 'small' as const,
        type: 'humanoid',
        ac: 15,
        hp_current: 7,
        hp_max: 7,
        speed: { walk: 30 },
        abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
        initiative: 12,
        initiative_bonus: 2,
        is_current_turn: false,
        order_tiebreak: 1,
        saves: {},
        skills: { stealth: 6 },
        senses: { darkvision: 60 },
        resistances: [],
        vulnerabilities: [],
        immunities: [],
        traits: [{ name: 'Nimble Escape', desc: 'Can take Disengage or Hide as a bonus action.' }],
        actions: [
          { 
            name: 'Scimitar', 
            desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.',
            attack_bonus: 4,
            damage_dice: '1d6',
            damage_bonus: 2
          }
        ],
        reactions: [],
        legendary_actions: [],
        languages: 'Common, Goblin'
      }
    ];

    const { data: createdMonsters, error: monsterError } = await supabase
      .from('encounter_monsters')
      .insert(monsters)
      .select();

    if (monsterError) throw monsterError;
    console.log("✅ Monsters created:", createdMonsters.length);

    // 5. Roll initiative for all combatants
    const initiativeRolls = [
      ...createdCharacters.map(char => ({
        encounter_id: encounter.id,
        combatant_id: char.id,
        combatant_type: 'character' as const,
        initiative_roll: Math.floor(Math.random() * 20) + 1 + char.initiative_bonus,
        dex_modifier: char.initiative_bonus,
        passive_perception: char.passive_perception,
        is_current_turn: false
      })),
      ...createdMonsters.map(monster => ({
        encounter_id: encounter.id,
        combatant_id: monster.id,
        combatant_type: 'monster' as const,
        initiative_roll: monster.initiative,
        dex_modifier: monster.initiative_bonus,
        passive_perception: 8,
        is_current_turn: false
      }))
    ];

    // Sort by initiative and set first as current turn
    initiativeRolls.sort((a, b) => {
      if (b.initiative_roll !== a.initiative_roll) {
        return b.initiative_roll - a.initiative_roll;
      }
      return b.dex_modifier - a.dex_modifier;
    });

    if (initiativeRolls.length > 0) {
      initiativeRolls[0].is_current_turn = true;
    }

    const { error: initiativeError } = await supabase
      .from('initiative')
      .insert(initiativeRolls);

    if (initiativeError) throw initiativeError;
    console.log("✅ Initiative rolled for all combatants");

    // 6. Add some sample conditions
    const conditions = [
      {
        encounter_id: encounter.id,
        character_id: createdCharacters[0].id,
        condition: 'blessed' as any, // Using any for custom condition
        ends_at_round: 11, // 10 rounds from now
        source_effect_id: null
      }
    ];

    const { error: conditionError } = await supabase
      .from('character_conditions')
      .insert(conditions);

    if (conditionError) {
      console.warn("⚠️ Could not create conditions (table may not exist yet):", conditionError);
    } else {
      console.log("✅ Conditions added");
    }

    // 7. Add a sample effect
    const effects = [
      {
        encounter_id: encounter.id,
        character_id: createdCharacters[1].id,
        name: 'Mage Armor',
        description: 'AC becomes 13 + Dex modifier',
        start_round: 1,
        end_round: 9, // 8 hours
        requires_concentration: false,
        source: 'Elara Moonwhisper'
      }
    ];

    const { error: effectError } = await supabase
      .from('effects')
      .insert(effects);

    if (effectError) {
      console.warn("⚠️ Could not create effects:", effectError);
    } else {
      console.log("✅ Effects added");
    }

    console.log("✨ Seed data creation complete!");

    return {
      campaign_id: campaign.id,
      encounter_id: encounter.id,
      character_ids: createdCharacters.map(c => c.id),
      monster_ids: createdMonsters.map(m => m.id)
    };

  } catch (error) {
    console.error("❌ Error seeding combat data:", error);
    return null;
  }
}

/**
 * Cleans up all seed data for the given campaign
 */
export async function cleanupSeedData(campaignId: string): Promise<void> {
  try {
    console.log("🧹 Cleaning up seed data for campaign:", campaignId);

    // Delete campaign (cascade will handle related records)
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) throw error;
    console.log("✅ Seed data cleaned up");
  } catch (error) {
    console.error("❌ Error cleaning up seed data:", error);
  }
}
