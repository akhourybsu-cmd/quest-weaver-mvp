

# SRD Data Integrity Audit & Fix Plan

## Current State

| Table | Rows | Status |
|-------|------|--------|
| srd_classes | 12 | OK |
| srd_subclasses | 14 | OK (but 2 missing features) |
| srd_subclass_features | 58 | Eldritch Knight + Arcane Trickster = 0 features |
| srd_ancestries | 9 | OK |
| srd_subancestries | 4 | OK (Hill Dwarf, High Elf, Lightfoot, Rock Gnome) |
| srd_backgrounds | 52 | OK |
| srd_class_features | 226 | Wizard=10, Sorcerer=13 seem low |
| srd_spells | 1146 | **827 are junk** (level=0, no classes) |
| srd_feats | 387 | 51 missing descriptions |
| srd_weapons | 43 | OK |
| srd_armor | 24 | OK |
| srd_tools | 39 | OK |
| srd_languages | 16 | OK |
| srd_equipment | **0** | EMPTY -- no adventuring gear |
| srd_spell_slots | **0** | EMPTY (unused; code uses hardcoded tables) |

---

## Problems to Fix

### 1. 827 Junk Spells (Critical)
The Open5e v1 import fetched ALL spells (including third-party content from non-SRD documents). 827 spells have `level=0` and `classes='{}'` -- these are broken non-SRD entries like "Ice Soldiers", "Accelerando", "Altered Strike". The 319 good spells (Fireball, Cure Wounds, Shield, etc.) all have correct class assignments and levels.

**Fix:** Delete all spells where `classes = '{}'` (empty array). These are unusable and pollute search/selection UIs. The ~319 remaining are the actual SRD spells.

### 2. Empty `srd_equipment` Table (High)
No adventuring gear exists in the database (rope, torches, explorer's pack, etc.). The `import-srd-core` edge function has an `importEquipment` function but it apparently returned 0 results from the Open5e v2 API.

**Fix:** Seed adventuring gear directly via SQL migration with the core SRD items (Explorer's Pack contents, Dungeoneer's Pack, Priest's Pack, etc.) -- approximately 50 items.

### 3. Eldritch Knight & Arcane Trickster Missing Features (High)
These two subclasses exist in the `srd_subclasses` table but have zero entries in `srd_subclass_features`. The local seed file (`subclassesSeed.ts`) also doesn't include them.

**Fix:** Add subclass features for both to the seed file and insert via migration. Eldritch Knight gets Spellcasting (3), War Magic (7), Eldritch Strike (10), Arcane Charge (15), Improved War Magic (18). Arcane Trickster gets Spellcasting (3), Mage Hand Legerdemain (3), Magical Ambush (9), Versatile Trickster (13), Spell Thief (17).

### 4. 51 Feats Missing Descriptions (Medium)
Of 387 feats, 51 have empty descriptions. These were likely imported with missing `desc` fields from the Open5e API. Many of these appear to be non-SRD third-party feats (e.g., "Guarded Warrior", "Heavily Outfitted").

**Fix:** Delete non-SRD feats without descriptions that don't match known PHB/SRD feats. The core SRD only has ~1 feat (Grappler). The remaining 336 with descriptions are from various Open5e sources and are still useful.

### 5. Low Feature Counts for Some Classes (Low)
Wizard has 10 features, Sorcerer 13, Druid 14. These are technically correct for the SRD since many levels only grant spell slot increases (not explicit features), and ASI at levels 4/8/12/16/19 may already be included. No action needed unless specific features are confirmed missing.

### 6. `srd_spell_slots` Table Empty (No Action)
The code in `spellRules.ts` uses hardcoded `FULL_CASTER_SLOTS` tables. This DB table is unused. No fix needed.

---

## Implementation

### Step 1: Clean junk spells via SQL migration
```sql
DELETE FROM srd_spells WHERE classes = '{}' AND level = 0;
```

### Step 2: Seed Eldritch Knight & Arcane Trickster features
Add ~10 subclass features via SQL migration using the existing subclass IDs.

### Step 3: Seed adventuring equipment
Insert ~50 SRD adventuring gear items (packs, tools, supplies) into `srd_equipment`.

### Step 4: Clean orphaned feats
Remove feats with no description that aren't core SRD, keeping the 336 that have proper data.

### Step 5: Update `subclassesSeed.ts`
Add Eldritch Knight and Arcane Trickster to the local seed file for consistency with the auto-seed hook.

### Step 6: Update `useSRDAutoSeed` and `SRDDataSeeder`
Add equipment seeding and subclass feature gap detection to the auto-seed logic so new deployments get complete data.

