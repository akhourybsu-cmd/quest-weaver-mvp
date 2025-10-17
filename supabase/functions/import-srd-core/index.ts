import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

// Declare EdgeRuntime for background tasks
declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPEN5E_BASE = "https://api.open5e.com";
const SRD_SLUG = "5esrd";

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
    console.log("Starting SRD import in background...");
    
    // Run import as background task to avoid timeout
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          );

          const results: ImportResult[] = [];

          // Import Documents (metadata)
          console.log("Importing documents...");
          results.push(await importDocuments(supabase));

          // Import Languages
          console.log("Importing languages...");
          results.push(await importLanguages(supabase));

          // Import Classes
          console.log("Importing classes...");
          results.push(await importClasses(supabase));

          // Import Ancestries (Races)
          console.log("Importing ancestries...");
          results.push(await importAncestries(supabase));

          // Import Backgrounds
          console.log("Importing backgrounds...");
          results.push(await importBackgrounds(supabase));

          // Import Armor
          console.log("Importing armor...");
          results.push(await importArmor(supabase));

          // Import Weapons
          console.log("Importing weapons...");
          results.push(await importWeapons(supabase));

          // Import Spells
          console.log("Importing spells...");
          results.push(await importSpells(supabase));

          // Import Feats
          console.log("Importing feats...");
          results.push(await importFeats(supabase));

          // Import Conditions
          console.log("Importing conditions...");
          results.push(await importConditions(supabase));

          // Import Magic Items
          console.log("Importing magic items...");
          results.push(await importMagicItems(supabase));

          console.log("Import completed successfully!");
          console.log(`Total imported: ${results.reduce((sum, r) => sum + r.imported, 0)}`);
          console.log(`Total errors: ${results.reduce((sum, r) => sum + r.errors.length, 0)}`);
        } catch (error) {
          console.error('Background import error:', error);
        }
      })()
    );

    // Return immediate response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'SRD import started in background. This may take several minutes. Check the logs for progress.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error starting SRD import:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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

// Import documents metadata
async function importDocuments(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Documents', imported: 0, skipped: 0, errors: [] };
  
  try {
    const documents = await fetchAllPages(`${OPEN5E_BASE}/v2/documents/?format=json`);
    
    for (const doc of documents) {
      const { error } = await supabase.from('srd_documents').upsert({
        slug: doc.slug,
        title: doc.title,
        description: doc.desc || null,
        author: doc.author || null,
        version: doc.version || null,
      }, { onConflict: 'slug' });
      
      if (error) {
        result.errors.push(`${doc.slug}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(errorMessage);
  }
  
  return result;
}

async function importLanguages(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'languages', imported: 0, skipped: 0, errors: [] };
  
  // Hardcoded common SRD languages since Open5e doesn't have a dedicated endpoint
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
    const { error } = await supabase
      .from('srd_languages')
      .upsert(lang, { onConflict: 'name' });

    if (error) {
      result.errors.push(`Language ${lang.name}: ${error.message}`);
    } else {
      result.imported++;
    }
  }

  return result;
}

async function importClasses(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'classes', imported: 0, skipped: 0, errors: [] };
  
  try {
    const classes = await fetchAllPages(`${OPEN5E_BASE}/v1/classes/?document__slug=${SRD_SLUG}&limit=100`);

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
            from: cls.prof_skills?.match(/from (.+)/)?.[ 1]?.split(',').map((s: string) => s.trim()) || []
          }
        },
        starting_equipment: cls.equipment || {},
        spellcasting_progression: cls.spellcasting_ability ? 'full' : null,
        spellcasting_ability: cls.spellcasting_ability?.toLowerCase() || null,
      };

      const { error } = await supabase
        .from('srd_classes')
        .upsert(classData, { onConflict: 'name' });

      if (error) {
        result.errors.push(`Class ${cls.name}: ${error.message}`);
      } else {
        result.imported++;

        // Import subclasses if available
        if (cls.archetypes && Array.isArray(cls.archetypes)) {
          for (const arch of cls.archetypes) {
            const subclassData = {
              class_id: (await supabase.from('srd_classes').select('id').eq('name', cls.name).single()).data?.id,
              name: arch.name,
              unlock_level: 3,
              features: arch.desc || ''
            };

            await supabase
              .from('srd_subclasses')
              .upsert(subclassData, { onConflict: 'class_id,name' });
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Classes import failed: ${errorMessage}`);
  }

  return result;
}

async function importAncestries(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'ancestries', imported: 0, skipped: 0, errors: [] };
  
  try {
    const races = await fetchAllPages(`${OPEN5E_BASE}/v1/races/?document__slug=${SRD_SLUG}&limit=100`);

    for (const race of races) {
      const ancestryData = {
        name: race.name,
        speed: race.speed || 30,
        size: race.size || 'Medium',
        ability_bonuses: race.asi?.map((asi: any) => ({
          ability: asi.attributes[0],
          bonus: asi.value
        })) || [],
        languages: race.languages?.split(',').map((l: string) => l.trim()) || [],
        traits: race.traits || ''
      };

      const { data: inserted, error } = await supabase
        .from('srd_ancestries')
        .upsert(ancestryData, { onConflict: 'name' })
        .select('id')
        .single();

      if (error) {
        result.errors.push(`Ancestry ${race.name}: ${error.message}`);
      } else {
        result.imported++;

        // Import subraces
        if (race.subraces && Array.isArray(race.subraces)) {
          for (const subrace of race.subraces) {
            const subraceData = {
              ancestry_id: inserted.id,
              name: subrace.name,
              traits: subrace.desc || '',
              ability_bonuses: subrace.asi || []
            };

            await supabase
              .from('srd_subancestries')
              .upsert(subraceData, { onConflict: 'ancestry_id,name' });
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Ancestries import failed: ${errorMessage}`);
  }

  return result;
}

async function importBackgrounds(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'backgrounds', imported: 0, skipped: 0, errors: [] };
  
  try {
    const backgrounds = await fetchAllPages(`${OPEN5E_BASE}/v2/backgrounds/?document__slug=${SRD_SLUG}&limit=100`);

    for (const bg of backgrounds) {
      const bgData = {
        name: bg.name,
        skill_proficiencies: bg.skill_proficiencies || [],
        tool_proficiencies: bg.tool_proficiencies || [],
        languages: bg.languages || [],
        equipment: bg.equipment || [],
        feature: bg.feature || ''
      };

      const { error } = await supabase
        .from('srd_backgrounds')
        .upsert(bgData, { onConflict: 'name' });

      if (error) {
        result.errors.push(`Background ${bg.name}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Backgrounds import failed: ${errorMessage}`);
  }

  return result;
}

async function importArmor(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'armor', imported: 0, skipped: 0, errors: [] };
  
  try {
    const armors = await fetchAllPages(`${OPEN5E_BASE}/v2/armor/?document__slug=${SRD_SLUG}&limit=100`);

    for (const armor of armors) {
      const armorData = {
        name: armor.name,
        category: armor.armor_category || 'Light',
        base_ac: armor.ac_base || 10,
        dex_cap: armor.ac_add_dex_mod_max || null,
        strength_required: armor.strength_required || null,
        stealth_disadvantage: armor.stealth_disadvantage || false,
        cost_gp: armor.cost ? parseFloat(armor.cost.replace(/[^\d.]/g, '')) : 0,
        weight_lb: armor.weight || 0
      };

      const { error } = await supabase
        .from('srd_armor')
        .upsert(armorData, { onConflict: 'name' });

      if (error) {
        result.errors.push(`Armor ${armor.name}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Armor import failed: ${errorMessage}`);
  }

  return result;
}

async function importWeapons(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'weapons', imported: 0, skipped: 0, errors: [] };
  
  try {
    const weapons = await fetchAllPages(`${OPEN5E_BASE}/v2/weapons/?document__slug=${SRD_SLUG}&limit=100`);

    for (const weapon of weapons) {
      const weaponData = {
        name: weapon.name,
        category: weapon.weapon_category || 'Simple Melee',
        damage: weapon.damage_dice || '1d4',
        damage_type: weapon.damage_type || 'bludgeoning',
        properties: weapon.properties || [],
        cost_gp: weapon.cost ? parseFloat(weapon.cost.replace(/[^\d.]/g, '')) : 0,
        weight_lb: weapon.weight || 0
      };

      const { error } = await supabase
        .from('srd_weapons')
        .upsert(weaponData, { onConflict: 'name' });

      if (error) {
        result.errors.push(`Weapon ${weapon.name}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Weapons import failed: ${errorMessage}`);
  }

  return result;
}

async function importSpells(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'spells', imported: 0, skipped: 0, errors: [] };
  
  try {
    const spells = await fetchAllPages(`${OPEN5E_BASE}/v2/spells/?document__slug=${SRD_SLUG}&limit=100`);

    for (const spell of spells) {
      const spellData = {
        name: spell.name,
        level: spell.level_int || 0,
        school: spell.school || 'evocation',
        casting_time: spell.casting_time || '1 action',
        range: spell.range || '30 feet',
        components: spell.components || [],
        duration: spell.duration || 'Instantaneous',
        concentration: spell.concentration || false,
        ritual: spell.ritual || false,
        description: spell.desc || '',
        higher_levels: spell.higher_level || null,
        classes: spell.dnd_class ? spell.dnd_class.split(',').map((c: string) => c.trim()) : []
      };

      const { error } = await supabase
        .from('srd_spells')
        .upsert(spellData, { onConflict: 'name' });

      if (error) {
        result.errors.push(`Spell ${spell.name}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Spells import failed: ${errorMessage}`);
  }

  return result;
}

// Import spell-to-class mappings
async function importSpellList(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Spell Classes', imported: 0, skipped: 0, errors: [] };
  
  try {
    const spellLists = await fetchAllPages(`${OPEN5E_BASE}/v1/spelllist/?document__slug=${SRD_SLUG}&format=json`);
    
    for (const list of spellLists) {
      for (const spell of list.spells || []) {
        const { error } = await supabase.from('srd_spell_classes').upsert({
          spell_slug: spell.slug,
          class_slug: list.class_slug,
          level: spell.level || 0,
        }, { onConflict: 'spell_slug,class_slug' });
        
        if (error) {
          result.errors.push(`${spell.slug}-${list.class_slug}: ${error.message}`);
        } else {
          result.imported++;
        }
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(errorMessage);
  }
  
  return result;
}

// Import feats
async function importFeats(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Feats', imported: 0, skipped: 0, errors: [] };
  
  try {
    const feats = await fetchAllPages(`${OPEN5E_BASE}/v2/feats/?document__slug=${SRD_SLUG}&format=json`);
    
    for (const feat of feats) {
      const { error } = await supabase.from('srd_feats').upsert({
        slug: feat.slug,
        name: feat.name,
        prerequisite: feat.prerequisite || null,
        description: feat.desc || null,
        document: feat.document || SRD_SLUG,
      }, { onConflict: 'slug' });
      
      if (error) {
        result.errors.push(`${feat.slug}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(errorMessage);
  }
  
  return result;
}

// Import conditions
async function importConditions(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Conditions', imported: 0, skipped: 0, errors: [] };
  
  try {
    const conditions = await fetchAllPages(`${OPEN5E_BASE}/v2/conditions/?document__slug=${SRD_SLUG}&format=json`);
    
    for (const condition of conditions) {
      const { error } = await supabase.from('srd_conditions').upsert({
        slug: condition.slug,
        name: condition.name,
        description: condition.desc || null,
        document: condition.document || SRD_SLUG,
      }, { onConflict: 'slug' });
      
      if (error) {
        result.errors.push(`${condition.slug}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(errorMessage);
  }
  
  return result;
}

// Import magic items
async function importMagicItems(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Magic Items', imported: 0, skipped: 0, errors: [] };
  
  try {
    const items = await fetchAllPages(`${OPEN5E_BASE}/v1/magicitems/?document__slug=${SRD_SLUG}&format=json`);
    
    for (const item of items) {
      const { error } = await supabase.from('srd_magic_items').upsert({
        slug: item.slug,
        name: item.name,
        type: item.type || null,
        rarity: item.rarity || null,
        requires_attunement: item.requires_attunement || false,
        description: item.desc || null,
        document: item.document || SRD_SLUG,
      }, { onConflict: 'slug' });
      
      if (error) {
        result.errors.push(`${item.slug}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(errorMessage);
  }
  
  return result;
}

// Import planes
async function importPlanes(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Planes', imported: 0, skipped: 0, errors: [] };
  
  try {
    const planes = await fetchAllPages(`${OPEN5E_BASE}/v1/planes/?document__slug=${SRD_SLUG}&format=json`);
    
    for (const plane of planes) {
      const { error } = await supabase.from('srd_planes').upsert({
        slug: plane.slug,
        name: plane.name,
        description: plane.desc || null,
        document: plane.document || SRD_SLUG,
      }, { onConflict: 'slug' });
      
      if (error) {
        result.errors.push(`${plane.slug}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(errorMessage);
  }
  
  return result;
}

// Import sections (lore/content)
async function importSections(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Sections', imported: 0, skipped: 0, errors: [] };
  
  try {
    const sections = await fetchAllPages(`${OPEN5E_BASE}/v1/sections/?document__slug=${SRD_SLUG}&format=json`);
    
    for (const section of sections) {
      const { error } = await supabase.from('srd_sections').upsert({
        slug: section.slug,
        name: section.name,
        parent: section.parent || null,
        description: section.desc || null,
        document: section.document || SRD_SLUG,
      }, { onConflict: 'slug' });
      
      if (error) {
        result.errors.push(`${section.slug}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(errorMessage);
  }
  
  return result;
}

// Import monsters
async function importMonsters(supabase: any): Promise<ImportResult> {
  const result: ImportResult = { entity: 'Monsters', imported: 0, skipped: 0, errors: [] };
  
  try {
    const monsters = await fetchAllPages(`${OPEN5E_BASE}/v1/monsters/?document__slug=${SRD_SLUG}&format=json`);
    
    for (const monster of monsters) {
      const { error } = await supabase.from('monster_catalog').upsert({
        slug: monster.slug,
        name: monster.name,
        size: monster.size?.toLowerCase() || 'medium',
        type: monster.type || 'beast',
        alignment: monster.alignment || null,
        ac: monster.armor_class || 10,
        hp: monster.hit_points || 1,
        hit_dice: monster.hit_dice || '1d8',
        speed: monster.speed || {},
        str: monster.strength || 10,
        dex: monster.dexterity || 10,
        con: monster.constitution || 10,
        int: monster.intelligence || 10,
        wis: monster.wisdom || 10,
        cha: monster.charisma || 10,
        saves: monster.strength_save ? {
          str: monster.strength_save,
          dex: monster.dexterity_save,
          con: monster.constitution_save,
          int: monster.intelligence_save,
          wis: monster.wisdom_save,
          cha: monster.charisma_save,
        } : {},
        skills: monster.skills || {},
        damage_vulnerabilities: monster.damage_vulnerabilities || null,
        damage_resistances: monster.damage_resistances || null,
        damage_immunities: monster.damage_immunities || null,
        condition_immunities: monster.condition_immunities || null,
        senses: monster.senses || null,
        languages: monster.languages || null,
        cr: monster.challenge_rating || '0',
        traits: monster.special_abilities || [],
        actions: monster.actions || [],
        reactions: monster.reactions || [],
        legendary_actions: monster.legendary_actions || [],
        source_type: 'srd',
      }, { onConflict: 'slug' });
      
      if (error) {
        result.errors.push(`${monster.slug}: ${error.message}`);
      } else {
        result.imported++;
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(errorMessage);
  }
  
  return result;
}
