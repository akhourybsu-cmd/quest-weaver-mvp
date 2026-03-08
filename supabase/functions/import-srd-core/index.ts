import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPEN5E_BASE = "https://api.open5e.com";
const SRD_V1_SLUG = "wotc-srd";      // v1 endpoints use document__slug=wotc-srd
const SRD_V2_KEY = "srd-2014";        // v2 endpoints use document__key=srd-2014

// Known SRD document slugs to accept
const SRD_SLUGS = new Set(["5esrd", "wotc-srd", "srd"]);

interface ImportResult {
  entity: string;
  imported: number;
  skipped: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: adminRole } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { categories = [], cleanFirst = false } = await req.json().catch(() => ({ categories: [], cleanFirst: false }));
    
    console.log("Starting SRD import...", { categories: categories.length > 0 ? categories : "ALL", cleanFirst });
    
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          );

          const results: ImportResult[] = [];
          const shouldImport = (category: string) => 
            categories.length === 0 || categories.includes(category);

          if (shouldImport('languages')) {
            console.log("Importing languages...");
            results.push(await importLanguages(supabase));
          }

          if (shouldImport('classes')) {
            console.log("Importing classes...");
            results.push(await importClasses(supabase));
          }

          if (shouldImport('ancestries')) {
            console.log("Importing ancestries...");
            results.push(await importAncestries(supabase));
          }

          if (shouldImport('backgrounds')) {
            console.log("Importing backgrounds...");
            results.push(await importBackgrounds(supabase));
          }

          if (shouldImport('armor')) {
            console.log("Importing armor...");
            results.push(await importArmor(supabase));
          }

          if (shouldImport('weapons')) {
            console.log("Importing weapons...");
            results.push(await importWeapons(supabase));
          }

          if (shouldImport('spells')) {
            console.log("Importing spells...");
            results.push(await importSpells(supabase));
          }

          if (shouldImport('feats')) {
            console.log("Importing feats...");
            results.push(await importFeats(supabase));
          }

          if (shouldImport('conditions')) {
            console.log("Importing conditions...");
            results.push(await importConditions(supabase));
          }

          if (shouldImport('magic_items')) {
            console.log("Importing magic items...");
            results.push(await importMagicItems(supabase));
          }

          if (shouldImport('monsters')) {
            console.log("Importing monsters...");
            results.push(await importMonsters(supabase));
          }

          // Post-import cleanup: remove junk data
          console.log("Running post-import cleanup...");
          await postImportCleanup(supabase);

          console.log("Import completed!");
          for (const r of results) {
            console.log(`  ${r.entity}: ${r.imported} imported, ${r.skipped} skipped, ${r.errors.length} errors`);
          }
        } catch (error) {
          console.error('Background import error:', error);
        }
      })()
    );

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `SRD import started in background. Check edge function logs for progress.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error starting SRD import:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ── Helpers ──

async function fetchAllPages(url: string): Promise<any[]> {
  const results: any[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response: Response = await fetch(nextUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${nextUrl}: ${response.statusText}`);
    }
    const data: any = await response.json();
    results.push(...(data.results || []));
    nextUrl = data.next;
  }

  return results;
}

function isSrdDoc(slug: string | undefined | null): boolean {
  if (!slug) return true; // If no slug, accept it
  return SRD_SLUGS.has(slug) || slug.toLowerCase().includes('srd');
}

// ── Post-import cleanup ──

async function postImportCleanup(supabase: any) {
  // Remove spells with empty classes AND level 0 (junk non-SRD entries)
  const { error: spellErr, count: spellCount } = await supabase
    .from('srd_spells')
    .delete()
    .eq('level', 0)
    .filter('classes', 'eq', '{}')
    .select('*', { count: 'exact', head: true });
  
  // Actually delete them properly
  const { data: junkSpells } = await supabase
    .from('srd_spells')
    .select('id')
    .eq('level', 0)
    .filter('classes', 'eq', '{}');
  
  if (junkSpells && junkSpells.length > 0) {
    const ids = junkSpells.map((s: any) => s.id);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      await supabase.from('srd_spells').delete().in('id', batch);
    }
    console.log(`Cleaned up ${junkSpells.length} junk spells`);
  }

  // Remove feats with no description (non-SRD junk)
  const { data: junkFeats } = await supabase
    .from('srd_feats')
    .select('id')
    .or('description.is.null,description.eq.');
  
  if (junkFeats && junkFeats.length > 0) {
    const ids = junkFeats.map((f: any) => f.id);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      await supabase.from('srd_feats').delete().in('id', batch);
    }
    console.log(`Cleaned up ${junkFeats.length} junk feats`);
  }
}

// ── Import functions ──

async function importLanguages(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Languages', imported: 0, skipped: 0, errors: [] };
  
  const languages = [
    { name: 'Common', script: 'Common' },
    { name: 'Dwarvish', script: 'Dwarvish' },
    { name: 'Elvish', script: 'Elvish' },
    { name: 'Giant', script: 'Dwarvish' },
    { name: 'Gnomish', script: 'Dwarvish' },
    { name: 'Goblin', script: 'Dwarvish' },
    { name: 'Halfling', script: 'Common' },
    { name: 'Orc', script: 'Dwarvish' },
    { name: 'Abyssal', script: 'Infernal' },
    { name: 'Celestial', script: 'Celestial' },
    { name: 'Draconic', script: 'Draconic' },
    { name: 'Deep Speech', script: null },
    { name: 'Infernal', script: 'Infernal' },
    { name: 'Primordial', script: 'Dwarvish' },
    { name: 'Sylvan', script: 'Elvish' },
    { name: 'Undercommon', script: 'Elvish' },
  ];

  for (const lang of languages) {
    const { error } = await supabase.from('srd_languages').upsert(lang, { onConflict: 'name' });
    if (error) result.errors.push(`${lang.name}: ${error.message}`);
    else result.imported++;
  }

  return result;
}

async function importClasses(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Classes', imported: 0, skipped: 0, errors: [] };
  
  try {
    const classes = await fetchAllPages(`${OPEN5E_BASE}/v1/classes/?document__slug=${SRD_V1_SLUG}&limit=100`);

    for (const cls of classes) {
      const classData = {
        name: cls.name,
        hit_die: cls.hit_dice || 8,
        saving_throws: cls.prof_saving_throws?.split(',').map((s: string) => s.trim().toLowerCase()) || [],
        proficiencies: {
          armor: cls.prof_armor?.split(',').map((s: string) => s.trim()) || [],
          weapons: cls.prof_weapons?.split(',').map((s: string) => s.trim()) || [],
          tools: cls.prof_tools?.split(',').map((s: string) => s.trim()) || [],
          skills: {
            choose: cls.prof_skills?.match(/Choose (\d+)/)?.[1] ? parseInt(cls.prof_skills.match(/Choose (\d+)/)[1]) : 2,
            from: cls.prof_skills?.match(/from (.+)/)?.[1]?.split(',').map((s: string) => s.trim()) || []
          }
        },
        starting_equipment: cls.equipment ? (typeof cls.equipment === 'string' ? [cls.equipment] : cls.equipment) : [],
        spellcasting_progression: cls.spellcasting_ability ? 'full' : null,
        spellcasting_ability: cls.spellcasting_ability?.toLowerCase() || null,
      };

      const { error } = await supabase.from('srd_classes').upsert(classData, { onConflict: 'name' });
      if (error) {
        result.errors.push(`${cls.name}: ${error.message}`);
      } else {
        result.imported++;

        // Import subclasses
        if (cls.archetypes && Array.isArray(cls.archetypes)) {
          const { data: classRow } = await supabase.from('srd_classes').select('id').eq('name', cls.name).single();
          if (classRow) {
            for (const arch of cls.archetypes) {
              await supabase.from('srd_subclasses').upsert({
                class_id: classRow.id,
                name: arch.name,
                unlock_level: 3,
                description: arch.desc || '',
              }, { onConflict: 'class_id,name' });
            }
          }
        }
      }
    }
  } catch (error) {
    result.errors.push(`Classes import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

async function importAncestries(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Ancestries', imported: 0, skipped: 0, errors: [] };
  
  try {
    const races = await fetchAllPages(`${OPEN5E_BASE}/v1/races/?document__slug=${SRD_V1_SLUG}&limit=100`);

    for (const race of races) {
      const ancestryData = {
        name: race.name,
        speed: race.speed || 30,
        size: race.size || 'Medium',
        ability_bonuses: race.asi?.map((asi: any) => ({
          ability: asi.attributes[0],
          bonus: asi.value
        })) || [],
        languages: race.languages ? race.languages.split(',').map((l: string) => l.trim()) : [],
        traits: race.traits ? (typeof race.traits === 'string' ? [{ name: 'Racial Traits', description: race.traits }] : race.traits) : [],
        proficiencies: [],
        options: {}
      };

      const { data: inserted, error } = await supabase
        .from('srd_ancestries')
        .upsert(ancestryData, { onConflict: 'name' })
        .select('id')
        .single();

      if (error) {
        result.errors.push(`${race.name}: ${error.message}`);
      } else {
        result.imported++;
        if (race.subraces && Array.isArray(race.subraces)) {
          for (const subrace of race.subraces) {
            await supabase.from('srd_subancestries').upsert({
              ancestry_id: inserted.id,
              name: subrace.name,
              traits: subrace.desc || '',
              ability_bonuses: subrace.asi || []
            }, { onConflict: 'ancestry_id,name' });
          }
        }
      }
    }
  } catch (error) {
    result.errors.push(`Ancestries import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

async function importBackgrounds(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Backgrounds', imported: 0, skipped: 0, errors: [] };
  
  try {
    const backgrounds = await fetchAllPages(`${OPEN5E_BASE}/v2/backgrounds/?document__key=${SRD_V2_KEY}&limit=100`);

    for (const bg of backgrounds) {
      const { error } = await supabase.from('srd_backgrounds').upsert({
        name: bg.name,
        skill_proficiencies: bg.skill_proficiencies || [],
        tool_proficiencies: bg.tool_proficiencies || [],
        languages: bg.languages || [],
        equipment: bg.equipment || [],
        feature: bg.feature || ''
      }, { onConflict: 'name' });

      if (error) result.errors.push(`${bg.name}: ${error.message}`);
      else result.imported++;
    }
  } catch (error) {
    result.errors.push(`Backgrounds import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

async function importArmor(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Armor', imported: 0, skipped: 0, errors: [] };
  
  try {
    const armors = await fetchAllPages(`${OPEN5E_BASE}/v2/armor/?document__key=${SRD_V2_KEY}&limit=100`);

    for (const armor of armors) {
      const category = armor.category ? 
        armor.category.charAt(0).toUpperCase() + armor.category.slice(1).toLowerCase() : 'Light';
      
      const { error } = await supabase.from('srd_armor').upsert({
        name: armor.name,
        category,
        base_ac: armor.ac_base || 10,
        dex_cap: armor.ac_cap_dexmod !== undefined ? armor.ac_cap_dexmod : null,
        strength_min: armor.strength_score_required || null,
        stealth_disadv: armor.grants_stealth_disadvantage || false,
        cost_gp: 0,
        weight: 0
      }, { onConflict: 'name' });

      if (error) result.errors.push(`${armor.name}: ${error.message}`);
      else result.imported++;
    }
  } catch (error) {
    result.errors.push(`Armor import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

async function importWeapons(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Weapons', imported: 0, skipped: 0, errors: [] };
  
  try {
    const weapons = await fetchAllPages(`${OPEN5E_BASE}/v2/weapons/?document__key=${SRD_V2_KEY}&limit=100`);

    for (const weapon of weapons) {
      const properties = Array.isArray(weapon.properties)
        ? weapon.properties.map((p: any) => p.property?.name || p).filter(Boolean)
        : [];
      
      const isRanged = properties.some((prop: string) => 
        prop.toLowerCase().includes('ammunition') || prop.toLowerCase().includes('thrown')
      ) || (weapon.range && weapon.range > 0);
      
      const category = `${weapon.is_simple ? 'Simple' : 'Martial'} ${isRanged ? 'Ranged' : 'Melee'}`;
      
      const damageType = typeof weapon.damage_type === 'object' 
        ? weapon.damage_type?.name?.toLowerCase() || 'bludgeoning'
        : weapon.damage_type || 'bludgeoning';

      const { error } = await supabase.from('srd_weapons').upsert({
        name: weapon.name,
        category,
        damage: weapon.damage_dice || '1d4',
        damage_type: damageType,
        properties,
        cost_gp: 0,
        weight: 0
      }, { onConflict: 'name' });

      if (error) result.errors.push(`${weapon.name}: ${error.message}`);
      else result.imported++;
    }
  } catch (error) {
    result.errors.push(`Weapons import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

async function importSpells(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Spells', imported: 0, skipped: 0, errors: [] };
  
  try {
    console.log("Fetching spells from Open5e v2 API (SRD-2014 only)...");
    const allSpells = await fetchAllPages(`${OPEN5E_BASE}/v2/spells/?document__key=srd-2014&limit=100`);
    console.log(`Fetched ${allSpells.length} SRD spells from v2 API`);

    for (const spell of allSpells) {
      // v2 provides classes as array of objects [{name: "Wizard", key: "srd_wizard"}]
      const classesArray = Array.isArray(spell.classes)
        ? spell.classes.map((c: any) => typeof c === 'string' ? c : c.name).filter(Boolean)
        : [];

      // Skip spells with no class assignments
      if (classesArray.length === 0) {
        result.skipped++;
        continue;
      }

      // v2 provides level as integer directly
      const spellLevel = typeof spell.level === 'number' ? spell.level
        : typeof spell.level_int === 'number' ? spell.level_int
        : 0;

      // v2 provides school as object {name, key} or string
      const schoolName = typeof spell.school === 'object'
        ? spell.school?.name || 'evocation' : spell.school || 'evocation';

      // v2 provides verbal/somatic/material as booleans
      const components: string[] = [];
      if (spell.verbal) components.push('V');
      if (spell.somatic) components.push('S');
      if (spell.material) components.push('M');

      const isConcentration = spell.concentration === true || spell.concentration === 'yes';
      const isRitual = spell.ritual === true || spell.ritual === 'yes';

      const { error } = await supabase.from('srd_spells').upsert({
        name: spell.name,
        level: spellLevel,
        school: schoolName.toLowerCase(),
        casting_time: spell.casting_time || '1 action',
        range: spell.range || '30 feet',
        components,
        duration: spell.duration || 'Instantaneous',
        concentration: isConcentration,
        ritual: isRitual,
        description: spell.desc || '',
        higher_levels: spell.higher_level || null,
        classes: classesArray
      }, { onConflict: 'name' });

      if (error) {
        result.errors.push(`${spell.name}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
    
    console.log(`Spells: ${result.imported} imported, ${result.skipped} skipped (no classes)`);
  } catch (error) {
    result.errors.push(`Spells import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

async function importFeats(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Feats', imported: 0, skipped: 0, errors: [] };
  
  try {
    // v2 feats from all documents (only 1 SRD feat exists — Grappler)
    // We import broadly to give users a wider selection
    const feats = await fetchAllPages(`${OPEN5E_BASE}/v2/feats/?limit=100`);
    
    // Track names we've already imported to skip duplicates from different sources
    const imported = new Set<string>();
    
    for (const feat of feats) {
      if (!feat.desc || feat.desc.trim().length === 0) {
        result.skipped++;
        continue;
      }
      
      // Skip duplicate names from different source books
      if (imported.has(feat.name)) {
        result.skipped++;
        continue;
      }
      imported.add(feat.name);

      const { error } = await supabase.from('srd_feats').upsert({
        name: feat.name,
        description: feat.desc || null,
        prerequisites: feat.prerequisite ? { raw: feat.prerequisite } : null,
      }, { onConflict: 'name' });
      
      if (error) result.errors.push(`${feat.name}: ${error.message}`);
      else result.imported++;
    }
  } catch (error) {
    result.errors.push(`Feats import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

async function importConditions(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Conditions', imported: 0, skipped: 0, errors: [] };
  
  try {
    const conditions = await fetchAllPages(`${OPEN5E_BASE}/v2/conditions/?document__key=${SRD_V2_KEY}&format=json`);
    
    for (const condition of conditions) {
      const { error } = await supabase.from('srd_conditions').upsert({
        slug: condition.slug,
        name: condition.name,
        description: condition.desc || null,
        document: condition.document?.key || SRD_V2_KEY,
      }, { onConflict: 'slug' });
      
      if (error) result.errors.push(`${condition.slug}: ${error.message}`);
      else result.imported++;
    }
  } catch (error) {
    result.errors.push(`Conditions import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

async function importMagicItems(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Magic Items', imported: 0, skipped: 0, errors: [] };
  
  try {
    const items = await fetchAllPages(`${OPEN5E_BASE}/v1/magicitems/?document__slug=${SRD_V1_SLUG}&format=json`);
    
    for (const item of items) {
      const { error } = await supabase.from('srd_magic_items').upsert({
        slug: item.slug,
        name: item.name,
        type: item.type || null,
        rarity: item.rarity || null,
        requires_attunement: item.requires_attunement || false,
        description: item.desc || null,
        document: item.document__slug || SRD_V1_SLUG,
      }, { onConflict: 'slug' });
      
      if (error) result.errors.push(`${item.slug}: ${error.message}`);
      else result.imported++;
    }
  } catch (error) {
    result.errors.push(`Magic items import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

async function importMonsters(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Monsters', imported: 0, skipped: 0, errors: [] };
  
  try {
    const monsters = await fetchAllPages(`${OPEN5E_BASE}/v1/monsters/?document__slug=${SRD_V1_SLUG}&format=json&limit=100`);
    console.log(`Fetched ${monsters.length} SRD monsters`);
    
    for (const monster of monsters) {
      const ac = typeof monster.armor_class === 'number'
        ? monster.armor_class
        : Array.isArray(monster.armor_class)
          ? (monster.armor_class[0]?.value || monster.armor_class[0] || 10)
          : 10;

      const saves: Record<string, number> = {};
      if (monster.strength_save != null) saves.str = monster.strength_save;
      if (monster.dexterity_save != null) saves.dex = monster.dexterity_save;
      if (monster.constitution_save != null) saves.con = monster.constitution_save;
      if (monster.intelligence_save != null) saves.int = monster.intelligence_save;
      if (monster.wisdom_save != null) saves.wis = monster.wisdom_save;
      if (monster.charisma_save != null) saves.cha = monster.charisma_save;

      const { error } = await supabase.from('monster_catalog').upsert({
        slug: monster.slug,
        name: monster.name,
        size: monster.size?.toLowerCase() || 'medium',
        type: (monster.type || 'beast').toLowerCase(),
        alignment: monster.alignment || null,
        ac,
        hp_avg: monster.hit_points || 1,
        hp_formula: monster.hit_dice || null,
        speed: monster.speed || {},
        abilities: {
          str: monster.strength || 10,
          dex: monster.dexterity || 10,
          con: monster.constitution || 10,
          int: monster.intelligence || 10,
          wis: monster.wisdom || 10,
          cha: monster.charisma || 10,
        },
        saves,
        skills: monster.skills || {},
        senses: typeof monster.senses === 'string' 
          ? { raw: monster.senses } 
          : monster.senses || {},
        languages: monster.languages || null,
        cr: parseFloat(monster.challenge_rating) || 0,
        vulnerabilities: monster.damage_vulnerabilities || [],
        resistances: monster.damage_resistances || [],
        immunities: monster.damage_immunities || [],
        traits: monster.special_abilities || [],
        actions: monster.actions || [],
        reactions: monster.reactions || [],
        legendary_actions: monster.legendary_actions || [],
        lair_actions: [],
        proficiency_bonus: 2,
        source: 'Open5e SRD',
      }, { onConflict: 'slug' });
      
      if (error) result.errors.push(`${monster.slug}: ${error.message}`);
      else result.imported++;
    }
    
    console.log(`Monsters: ${result.imported} imported, ${result.errors.length} errors`);
  } catch (error) {
    result.errors.push(`Monsters import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}
