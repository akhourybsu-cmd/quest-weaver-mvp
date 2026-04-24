import { supabase } from "@/integrations/supabase/client";
import { calculateModifier } from "@/lib/dnd5e";

// ============================================================================
// Canonical level-1 features per class. Used as a fallback when class_features
// table is empty / out of date. Only the features auto-granted at level 1.
// ============================================================================
const CLASS_LEVEL_1_FEATURES: Record<string, { name: string; description: string }[]> = {
  Barbarian: [
    { name: "Rage", description: "Enter a rage as a bonus action: +2 melee damage, advantage on STR checks/saves, resistance to bludgeoning/piercing/slashing. 2 uses/long rest." },
    { name: "Unarmored Defense", description: "While not wearing armor, your AC = 10 + DEX mod + CON mod. May use a shield." },
  ],
  Bard: [
    { name: "Spellcasting", description: "Cha-based spellcasting. 4 cantrips known, 4 1st-level spells known, 2 1st-level slots." },
    { name: "Bardic Inspiration (d6)", description: "Bonus action: grant a creature within 60ft a d6 to add to one ability check, attack roll, or save within 10 minutes. CHA mod uses/long rest." },
  ],
  Cleric: [
    { name: "Spellcasting", description: "Wis-based spellcasting. 3 cantrips known, prepare WIS mod + level spells, 2 1st-level slots." },
    { name: "Divine Domain", description: "Choose a divine domain at 1st level (grants extra features and spells)." },
  ],
  Druid: [
    { name: "Druidic", description: "Know Druidic, the secret language of druids." },
    { name: "Spellcasting", description: "Wis-based spellcasting. 2 cantrips known, prepare WIS mod + level spells, 2 1st-level slots." },
  ],
  Fighter: [
    { name: "Fighting Style", description: "Choose a fighting style: Archery, Defense, Dueling, Great Weapon Fighting, Protection, or Two-Weapon Fighting." },
    { name: "Second Wind", description: "Bonus action: regain 1d10 + fighter level HP. 1 use/short rest." },
  ],
  Monk: [
    { name: "Unarmored Defense", description: "While not wearing armor or shield, AC = 10 + DEX mod + WIS mod." },
    { name: "Martial Arts", description: "Use DEX for monk-weapon attacks; unarmed strike d4; bonus-action unarmed strike after Attack action." },
  ],
  Paladin: [
    { name: "Divine Sense", description: "Action: detect celestial/fiend/undead within 60ft. 1 + CHA mod uses/long rest." },
    { name: "Lay on Hands", description: "Pool of healing equal to 5 × paladin level. May also cure disease/poison (5 points each)." },
  ],
  Ranger: [
    { name: "Favored Enemy", description: "Choose a creature type: advantage on Survival to track and Intelligence checks to recall info about them." },
    { name: "Natural Explorer", description: "Choose a favored terrain: gain travel and tracking benefits in that terrain." },
  ],
  Rogue: [
    { name: "Expertise", description: "Choose two skill proficiencies (or one skill + Thieves' Tools). Your proficiency bonus is doubled for any check using either of those proficiencies." },
    { name: "Sneak Attack", description: "Once per turn, deal an extra 1d6 damage to one creature you hit with an attack if you have advantage, OR another enemy of the target is within 5ft of it (and you don't have disadvantage). Weapon must be finesse or ranged." },
    { name: "Thieves' Cant", description: "A secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation." },
  ],
  Sorcerer: [
    { name: "Spellcasting", description: "Cha-based spellcasting. 4 cantrips known, 2 1st-level spells known, 2 1st-level slots." },
    { name: "Sorcerous Origin", description: "Choose a sorcerous origin (e.g., Draconic Bloodline) granting extra features." },
  ],
  Warlock: [
    { name: "Otherworldly Patron", description: "Choose a patron (Archfey, Fiend, Great Old One) granting expanded spells and features." },
    { name: "Pact Magic", description: "Cha-based spellcasting. 2 cantrips known, 2 1st-level spells known, 1 1st-level pact slot (regained on short rest)." },
  ],
  Wizard: [
    { name: "Spellcasting", description: "Int-based spellcasting. 3 cantrips known, spellbook with 6 1st-level spells, prepare INT mod + level spells, 2 1st-level slots." },
    { name: "Arcane Recovery", description: "Once per day on a short rest, recover spell slots with combined level ≤ ½ wizard level (rounded up). No slot above 5th." },
  ],
};

// Strings that we know are placeholder labels coming from malformed SRD seed data.
const PLACEHOLDER_LANGUAGE_STRINGS = new Set([
  "One extra language",
  "Choose one extra language",
]);

// Skill labels that are actually sentences/instructions from SRD seed (e.g. Sailor).
// We split on "or" / commas and only keep tokens that match a real skill name.
const REAL_SKILLS = new Set([
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception",
  "History", "Insight", "Intimidation", "Investigation", "Medicine",
  "Nature", "Perception", "Performance", "Persuasion", "Religion",
  "Sleight of Hand", "Stealth", "Survival",
]);

function extractRealSkills(raw: string): string[] {
  const found: string[] = [];
  for (const skill of REAL_SKILLS) {
    const re = new RegExp(`\\b${skill}\\b`, "i");
    if (re.test(raw)) found.push(skill);
  }
  return found;
}

function extractRealTools(raw: string): string[] {
  // Split on commas / "and" / periods
  return raw
    .split(/,|\band\b|\./i)
    .map(s => s.trim())
    .filter(Boolean)
    // Title-case first letter of each word
    .map(s => s.replace(/\b\w/g, c => c.toUpperCase()))
    // Drop empties / single chars
    .filter(s => s.length > 1);
}

export type RepairReport = {
  skillsFixed: number;
  languagesFixed: number;
  toolsFixed: number;
  proficienciesAdded: string[];
  itemsEquipped: string[];
  featuresAdded: number;
  acRecomputed: boolean;
  passivePerceptionRecomputed: boolean;
};

/**
 * Repair stale or malformed character data created by older wizard versions
 * or malformed SRD seed entries. Idempotent — safe to run multiple times.
 */
export async function repairCharacterData(characterId: string): Promise<RepairReport> {
  const report: RepairReport = {
    skillsFixed: 0,
    languagesFixed: 0,
    toolsFixed: 0,
    proficienciesAdded: [],
    itemsEquipped: [],
    featuresAdded: 0,
    acRecomputed: false,
    passivePerceptionRecomputed: false,
  };

  // 1. Load character + abilities
  const { data: character, error: charErr } = await supabase
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .single();
  if (charErr || !character) throw charErr ?? new Error("Character not found");

  const { data: abilities } = await supabase
    .from("character_abilities")
    .select("*")
    .eq("character_id", characterId)
    .single();
  if (!abilities) throw new Error("Ability scores missing");

  // 2. Repair skills — strip sentence-shaped entries, expand into real skills
  const { data: skillRows } = await supabase
    .from("character_skills")
    .select("*")
    .eq("character_id", characterId);

  if (skillRows) {
    const seen = new Set<string>();
    const goodSkills: { id?: string; skill: string; proficient: boolean; expertise: boolean }[] = [];
    for (const row of skillRows) {
      // Detect malformed entry: contains comma OR "either" OR "or" mid-string
      if (row.skill.includes(",") || /\beither\b|\s\bor\b/i.test(row.skill)) {
        const realOnes = extractRealSkills(row.skill);
        // Delete the bad row
        await supabase.from("character_skills").delete().eq("id", row.id);
        report.skillsFixed += 1;
        // Add the first extracted real skill (we can't pick "either/or" for the user)
        if (realOnes.length > 0 && !seen.has(realOnes[0])) {
          goodSkills.push({ skill: realOnes[0], proficient: true, expertise: false });
          seen.add(realOnes[0]);
        }
      } else if (REAL_SKILLS.has(row.skill)) {
        if (!seen.has(row.skill)) {
          seen.add(row.skill);
        } else {
          // Duplicate — drop it
          await supabase.from("character_skills").delete().eq("id", row.id);
        }
      } else {
        // Unknown skill name — leave alone
        seen.add(row.skill);
      }
    }
    if (goodSkills.length > 0) {
      await supabase
        .from("character_skills")
        .insert(goodSkills.map(s => ({ ...s, character_id: characterId })));
    }
  }

  // 3. Repair languages — drop placeholder strings
  const { data: langRows } = await supabase
    .from("character_languages")
    .select("*")
    .eq("character_id", characterId);

  if (langRows) {
    for (const row of langRows) {
      if (PLACEHOLDER_LANGUAGE_STRINGS.has(row.name)) {
        await supabase.from("character_languages").delete().eq("id", row.id);
        report.languagesFixed += 1;
      }
    }
  }

  // 4. Repair tool proficiencies — split sentence-shaped entries
  const { data: profRows } = await supabase
    .from("character_proficiencies")
    .select("*")
    .eq("character_id", characterId);

  const existingProfNames = new Set(profRows?.map(p => p.name.toLowerCase()) ?? []);

  if (profRows) {
    for (const row of profRows) {
      if (row.type === "tool" && (row.name.includes(",") || row.name.endsWith("."))) {
        const cleaned = extractRealTools(row.name);
        await supabase.from("character_proficiencies").delete().eq("id", row.id);
        existingProfNames.delete(row.name.toLowerCase());
        report.toolsFixed += 1;
        for (const tool of cleaned) {
          if (!existingProfNames.has(tool.toLowerCase())) {
            await supabase.from("character_proficiencies").insert({
              character_id: characterId,
              type: "tool",
              name: tool,
            });
            existingProfNames.add(tool.toLowerCase());
          }
        }
      }
    }
  }

  // 5. Add missing class-granted proficiencies (e.g., Rogue → Thieves' Tools)
  if (character.class === "Rogue" && !existingProfNames.has("thieves' tools")) {
    await supabase.from("character_proficiencies").insert({
      character_id: characterId,
      type: "tool",
      name: "Thieves' Tools",
    });
    report.proficienciesAdded.push("Thieves' Tools");
    existingProfNames.add("thieves' tools");
  }

  // 6. Auto-equip armor and a primary weapon if nothing equipped
  const { data: equipRows } = await supabase
    .from("character_equipment")
    .select("*")
    .eq("character_id", characterId);

  if (equipRows && equipRows.length > 0) {
    const anyEquipped = equipRows.some(e => e.equipped);
    if (!anyEquipped) {
      const armor = equipRows.find(e => /armor|leather|chain|plate|hide|scale/i.test(e.item_ref));
      const weapon = equipRows.find(e => /sword|rapier|bow|dagger|axe|mace|staff|club|spear|hammer|crossbow/i.test(e.item_ref));
      if (armor) {
        await supabase.from("character_equipment").update({ equipped: true }).eq("id", armor.id);
        report.itemsEquipped.push(armor.item_ref);
      }
      if (weapon) {
        await supabase.from("character_equipment").update({ equipped: true }).eq("id", weapon.id);
        report.itemsEquipped.push(weapon.item_ref);
      }
    }
  }

  // 7. Populate level-1 class features if missing
  const { data: featureRows } = await supabase
    .from("character_features")
    .select("*")
    .eq("character_id", characterId);

  const existingFeatureNames = new Set(featureRows?.map(f => f.name.toLowerCase()) ?? []);
  const canonical = CLASS_LEVEL_1_FEATURES[character.class] ?? [];
  const featuresToAdd = canonical
    .filter(f => !existingFeatureNames.has(f.name.toLowerCase()))
    .map(f => ({
      character_id: characterId,
      name: f.name,
      description: f.description,
      source: character.class,
      level: 1,
    }));

  if (featuresToAdd.length > 0) {
    await supabase.from("character_features").insert(featuresToAdd);
    report.featuresAdded += featuresToAdd.length;
  }

  // 8. Recompute AC from equipped armor
  const { data: equipAfter } = await supabase
    .from("character_equipment")
    .select("*")
    .eq("character_id", characterId)
    .eq("equipped", true);

  const dexMod = calculateModifier(abilities.dex);
  let newAC = 10 + dexMod;
  if (equipAfter) {
    for (const e of equipAfter) {
      const ref = e.item_ref.toLowerCase();
      if (ref.includes("leather") && !ref.includes("studded")) {
        newAC = 11 + dexMod;
      } else if (ref.includes("studded leather")) {
        newAC = 12 + dexMod;
      } else if (ref.includes("hide")) {
        newAC = 12 + Math.min(dexMod, 2);
      } else if (ref.includes("chain shirt")) {
        newAC = 13 + Math.min(dexMod, 2);
      } else if (ref.includes("scale mail")) {
        newAC = 14 + Math.min(dexMod, 2);
      } else if (ref.includes("breastplate")) {
        newAC = 14 + Math.min(dexMod, 2);
      } else if (ref.includes("chain mail")) {
        newAC = 16;
      } else if (ref.includes("plate")) {
        newAC = 18;
      }
    }
  }

  // 9. Recompute passive perception
  const wisMod = calculateModifier(abilities.wis);
  const profBonus = character.proficiency_bonus ?? 2;
  const { data: postSkills } = await supabase
    .from("character_skills")
    .select("*")
    .eq("character_id", characterId);
  const perception = postSkills?.find(s => s.skill === "Perception");
  let passivePerception = 10 + wisMod;
  if (perception?.proficient) passivePerception += profBonus;
  if (perception?.expertise) passivePerception += profBonus;

  if (newAC !== character.ac || passivePerception !== character.passive_perception) {
    await supabase
      .from("characters")
      .update({ ac: newAC, passive_perception: passivePerception })
      .eq("id", characterId);
    report.acRecomputed = newAC !== character.ac;
    report.passivePerceptionRecomputed = passivePerception !== character.passive_perception;
  }

  return report;
}
