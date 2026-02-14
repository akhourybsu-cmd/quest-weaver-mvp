
# Bestiary System: Compendium + Homebrew Monster Builder

## Overview
Transform the Bestiary tab from a simple read-only monster list into a full two-source library with Compendium/Homebrew toggles, a multi-step monster creation wizard, reskin/duplicate support, and homebrew management -- all using the existing fantasy theme.

## What Already Exists
- **`monster_catalog` table**: 330 SRD monsters with full statblocks (abilities, actions, traits, reactions, legendary actions, speeds, saves, skills, senses, resistances, immunities, vulnerabilities, spellcasting summary)
- **`monster_homebrew` table**: Nearly identical schema with `owner_user_id`, `campaign_id`, `is_published` -- already has RLS policies for owner CRUD and campaign-member read access
- **`encounter_monsters` table**: Snapshot copies used in combat, with `source_type` (catalog/homebrew) and `source_monster_id`
- **`MonsterLibraryDialog`**: Existing dialog that shows catalog/homebrew tabs for adding to encounters
- **`BestiaryTab`**: Currently only queries `monster_catalog` -- ignores homebrew entirely

## Phased Approach

Due to the scale of this feature, this plan covers **Phase 1** (core system) which delivers the most impactful functionality. Phase 2 (advanced statblock editor, bulk management, import/paste) can follow.

---

## Phase 1: What We Build Now

### 1. Source Toggle Bar
A sticky bar above the filter card with:
- "Show Compendium" switch (default ON)
- "Show Homebrew" switch (default ON)
- "Create Monster" primary button (right side)

When both are off, show empty state with "Create Monster" CTA.

### 2. Unified Monster Grid
Merge `monster_catalog` and `monster_homebrew` queries into the same grid. Each card shows a subtle source badge ("SRD" vs "Homebrew"). Cards get source-appropriate quick actions:
- **Compendium cards**: View, Add to Encounter, Duplicate as Homebrew
- **Homebrew cards**: View, Edit, Add to Encounter, Duplicate, Delete (with confirmation)

### 3. Monster Detail Panel
Clicking a card opens a side-panel or dialog showing the full statblock: abilities, saves, skills, senses, resistances/immunities, traits, actions, reactions, legendary actions, and spellcasting summary. Themed with fantasy borders.

### 4. Monster Creation Wizard (Guided Builder)
A multi-step dialog (matching the character wizard style) with these steps:

**Step 1 -- Start**
- Choose: Blank Monster, From Existing (search + select to duplicate), or From Template (Brute/Skirmisher/Controller/Caster/Boss presets)
- Monster Name field
- Campaign association (optional)

**Step 2 -- Identity and Basics**
- Size (Tiny through Gargantuan)
- Type (beast, undead, fiend, etc.) + optional subtype
- Alignment (optional)
- CR (dropdown with auto proficiency bonus)

**Step 3 -- Defenses**
- AC + armor description
- HP: fixed number or dice formula (auto-calculates average)
- Speeds: walk, fly, swim, climb, burrow

**Step 4 -- Ability Scores and Saves**
- Six ability scores with auto-calculated modifiers
- Saving throw proficiency checkboxes
- Skills multi-select with auto-calculated bonuses

**Step 5 -- Traits and Resistances**
- Damage resistances, immunities, vulnerabilities (tag-style input)
- Condition immunities
- Senses (darkvision, blindsight, etc.)
- Languages

**Step 6 -- Actions**
Structured action builder with categories (Actions, Bonus Actions, Reactions, Legendary Actions, Lair Actions). Each action has:
- Name
- Description (rich text area)
- Optional attack data: to-hit bonus, reach/range, damage dice, damage type
- Optional save: DC, ability, effect on save
- Recharge (None / Recharge 5-6 / X per day)

**Step 7 -- Spellcasting (Optional)**
- Toggle: Has Spellcasting?
- Spellcasting ability, save DC, attack bonus
- Mode: Innate vs Spell Slots
- Spell list by level or per-day uses

**Step 8 -- Finalize**
- Live statblock preview (read-only rendered view)
- Tags input (boss, undead, aquatic, etc.)
- Visibility: Private / Published to campaign
- Save button + optional "Add to Encounter" shortcut
- Glowing brass CTA matching character wizard style

### 5. Reskin / Duplicate
"Duplicate as Homebrew" on any monster card (compendium or homebrew):
- Creates a new `monster_homebrew` row pre-filled with all stats
- Name auto-appended with "(Copy)"
- Opens the wizard in edit mode so user can modify
- Stores `derived_from_monster_id` and `derived_from_source` for lineage tracking

### 6. Edit Homebrew
"Edit" on homebrew cards opens the same wizard pre-populated with existing data. Save updates the row in-place.

### 7. Delete Homebrew
"Delete" shows an AlertDialog confirmation. On confirm, deletes the `monster_homebrew` row.

---

## Database Changes

### Add columns to `monster_homebrew`:
```
tags                    jsonb   DEFAULT '[]'
derived_from_monster_id uuid    NULLABLE
derived_from_source     text    NULLABLE  (values: 'catalog' or 'homebrew')
bonus_actions           jsonb   DEFAULT '[]'
condition_immunities    jsonb   DEFAULT '[]'
spellcasting            jsonb   DEFAULT '{}'
```

These fields extend the existing table without breaking anything. No changes to `monster_catalog` or `encounter_monsters`.

---

## Technical Details

### Files to create:
- `src/components/bestiary/BestiarySourceToggle.tsx` -- Source toggle bar with switches and Create button
- `src/components/bestiary/MonsterCard.tsx` -- Unified card component with source-aware actions
- `src/components/bestiary/MonsterDetailDialog.tsx` -- Full statblock view dialog
- `src/components/bestiary/MonsterWizard.tsx` -- Main wizard dialog with step navigation, progress, and fantasy theming
- `src/components/bestiary/wizard/StepStart.tsx` -- Start type selection (blank/existing/template)
- `src/components/bestiary/wizard/StepIdentity.tsx` -- Size, type, alignment, CR
- `src/components/bestiary/wizard/StepDefenses.tsx` -- AC, HP, speeds
- `src/components/bestiary/wizard/StepAbilities.tsx` -- Ability scores, saves, skills
- `src/components/bestiary/wizard/StepTraits.tsx` -- Resistances, immunities, senses, languages
- `src/components/bestiary/wizard/StepActions.tsx` -- Action builder with categories
- `src/components/bestiary/wizard/StepSpellcasting.tsx` -- Optional spellcasting block
- `src/components/bestiary/wizard/StepFinalize.tsx` -- Preview, tags, save
- `src/components/bestiary/wizard/StatblockPreview.tsx` -- Rendered statblock preview component
- `src/components/bestiary/wizard/monsterTemplates.ts` -- Preset templates (Brute, Skirmisher, Controller, Caster, Boss)
- `src/hooks/useMonsterForm.ts` -- Form state management hook for the wizard

### Files to modify:
- `src/components/campaign/tabs/BestiaryTab.tsx` -- Major rewrite: add homebrew fetching, source toggles, unified grid with new card component, wire up wizard/detail dialogs
- `src/integrations/supabase/types.ts` -- Will auto-update after migration

### Database migration:
- Add 6 new columns to `monster_homebrew` table (tags, derived_from fields, bonus_actions, condition_immunities, spellcasting)

### Approach:
- Monster wizard uses the same `fantasy-border-ornaments`, `font-cinzel`, brass accents, and `animate-fade-in` step transitions as the character creation wizard
- Form state managed via a custom hook (`useMonsterForm`) holding all wizard fields
- Saving writes to `monster_homebrew` via standard Supabase insert/update
- Templates are static objects in `monsterTemplates.ts` that pre-fill the form
- Statblock preview renders a read-only formatted view of the current form state

---

## Phase 2 (Future)
- Advanced Statblock Editor (tabbed editor with live preview as alternative to wizard)
- Manage Homebrew mode (bulk select, delete, export, tag editor)
- Import/Paste Statblock (JSON or natural language parsing)
- Quick Reskin Panel (keyword replacement, damage type swaps)
- Diff View showing changes from derived-from original
- Favorites system
- Environment tags and additional filter dimensions
