## Player Hub & Character Creation — Comprehensive 8-Phase Hardening

A massive, end-to-end audit and fix-up of every facet of character creation, leveling, display, and play for all 12 SRD classes, all subclasses, all ancestries/subancestries, and the full level 1–20 spectrum.

---

### Phase 1 — SRD Data Completeness
**Goal:** Every official SRD option exists in the database, fully fleshed out.

- Expand `src/data/srd/subancestriesSeed.ts` with the missing subraces:
  - **Dwarf:** Mountain Dwarf (+2 STR, Dwarven Armor Training)
  - **Elf:** Wood Elf (+1 WIS, Mask of the Wild, Fleet of Foot 35ft), Drow (+1 CHA, Superior Darkvision, Drow Magic, Sunlight Sensitivity, Drow Weapon Training)
  - **Halfling:** Stout (+1 CON, Stout Resilience)
  - **Gnome:** Forest Gnome (+1 DEX, Speak with Small Beasts, Minor Illusion cantrip)
- Audit `src/data/srd/classFeaturesSeed.ts` for all 12 classes × levels 1–20 for parity with the SRD (ASI levels 4/8/12/16/19, capstone features, Extra Attack progressions, channel divinity counts, ki points, rage uses, sneak attack dice, etc.).
- Audit `src/data/srd/subclassesSeed.ts` to ensure each subclass has features at every level the SRD grants them (e.g., Cleric Domain: 1/2/6/8/17, Fighter Martial Archetype: 3/7/10/15/18, Wizard Tradition: 2/6/10/14, etc.).
- Verify `subclassSpells.ts` covers all Domain Spells, Oath Spells, Circle Spells, Patron Expanded lists.
- Run a seeding pass through the existing `SRDDataSeeder` admin tool to push new data.

---

### Phase 2 — Character Wizard Flow Audit (All 12 Classes)
**Goal:** Walk every class through `CharacterWizard.tsx` at L1, L3 (subclass unlock), L5, and L11.

- Verify class-specific steps fire correctly: Fighting Style (Fighter/Paladin/Ranger), Divine Domain (Cleric L1), Sorcerous Origin (Sorcerer L1), Otherworldly Patron (Warlock L1), Pact Boon (Warlock L3), Eldritch Invocations (Warlock), Metamagic (Sorcerer L3), Expertise (Rogue/Bard), Druid Circle, Monastic Tradition, Primal Path, Roguish Archetype, Bard College, Ranger Conclave, Wizard Tradition.
- Validate skill choice counts per class (Bard: 3, Ranger: 3, Rogue: 4, others: 2).
- Validate equipment bundle selection renders for each class.
- Verify `StepLevelChoices` correctly walks levels 2 → target when starting above L1.

---

### Phase 3 — Subclass Coverage & Auto-Granted Features
**Goal:** Selected subclass surfaces every mechanical hook on the sheet.

- Verify auto-prepared spells (Domain/Oath/Circle/Patron Expanded) flow into `is_always_prepared` rows.
- Confirm resource displays render for subclass features: Channel Divinity uses, Wild Shape charges, Bardic Inspiration die, Sorcery Points, Ki, Superiority Dice, Rage uses & damage, Sneak Attack dice.
- Check `PlayerFeatures.tsx` lists every subclass feature with proper level gating.
- Validate Eldritch Knight / Arcane Trickster third-caster spell progression and Wizard-list filtering.

---

### Phase 4 — Multiclassing
**Goal:** Multiclass is mechanically airtight.

- `multiclassRules.ts`: prerequisite ability score gating per SRD (e.g., STR 13 for Fighter, WIS 13 + STR 13 for Paladin entry).
- Combined caster level → spell slot table calculation (full/half/third caster weighting, Warlock pact slots tracked separately).
- Proficiency grants on multiclass entry (limited subset, not full L1 list).
- HP roll uses new class hit die.

---

### Phase 5 — Character Sheet Display Audit
**Goal:** Every derived stat renders correctly across all class/subclass/ancestry combinations.

- `PlayerCharacterSheet.tsx`: AC (with armor + shield + DEX cap), Initiative (DEX + bonuses like Jack of All Trades for Bard), Passive Perception/Investigation/Insight, Saving Throws (filled-dot proficiency indicator), Speed (with Wood Elf/Monk Unarmored Movement bonuses), Darkvision range.
- HP color tokens (bg-status-hp / warning / buff) at thresholds; death save tracker auto-shows at 0 HP.
- Subclass badge visible in header; "Subclass Available!" pulsing badge at L3 if not chosen.

---

### Phase 6 — Inventory, Resources & Rest
**Goal:** Resource pools & rest cycles obey SRD.

- `PlayerInventory.tsx`: attunement cap of 3, ammo expenditure & recovery, currency totals, encumbrance (optional flag).
- `RestManager.tsx`: short rest restores Warlock pact slots, Monk Ki (Wholeness of Body cases), Fighter Action Surge & Second Wind, Bardic Inspiration (L5+); long rest restores HP, all spell slots, hit dice (up to half), exhaustion -1.
- Reset class resources (Rage, Channel Divinity, Wild Shape) on appropriate rest type.

---

### Phase 7 — Level-Up Wizard Audit
**Goal:** `LevelUpWizard.tsx` mirrors creation wizard parity at every increment.

- ASI vs Feat choice at 4/8/12/16/19 (Fighter +6/14, Rogue +10).
- Subclass unlock prompts at correct levels per class.
- New spells known/prepared math per class progression table.
- Class-specific level-up steps: new Invocations (Warlock), Metamagic options (Sorcerer L10/17), Magical Secrets (Bard L10/14/18), Expertise expansion (Rogue L6, Bard L10), Mystic Arcanum (Warlock L11/13/15/17).
- Retroactive HP recalc when CON modifier increases.

---

### Phase 8 — Bug Fixes, Regression & Tests
**Goal:** Lock it down so nothing regresses.

- Fix any defects discovered in Phases 1–7.
- Add unit tests under `src/lib/rules/__tests__/` for: spell slot math, multiclass caster level, skill modifier with expertise, AC with each armor category, HP recompute on CON change, subclass spell auto-prep.
- Smoke-test seeded fixtures: one character per class created at L1, L5, L11, L20.
- Final manual pass through Player Hub navigation (dashboard → character list → sheet → spellbook → features → inventory).

---

### Files Touched (high-level)
| Area | Key files |
|------|-----------|
| SRD seeds | `src/data/srd/subancestriesSeed.ts`, `classFeaturesSeed.ts`, `subclassesSeed.ts`, `subclassSpells.ts` |
| Rules | `src/lib/rules/5eRules.ts`, `multiclassRules.ts`, `src/lib/characterRules.ts` |
| Wizards | `src/components/character/CharacterWizard.tsx`, `LevelUpWizard.tsx`, `StepLevelChoices.tsx` and step subcomponents |
| Sheet | `src/components/player/PlayerCharacterSheet.tsx`, `PlayerFeatures.tsx`, `PlayerInventory.tsx`, `PlayerSpellbook.tsx`, `RestManager.tsx` |
| Tests | `src/lib/rules/__tests__/*.test.ts` (new) |

### Out of Scope
- Non-SRD content (UA, third-party, homebrew classes) — already excluded by project policy.
- Visual/aesthetic redesign of the sheet (mechanics-only pass).
- Combat tracker changes beyond resource-pool resets.

### Execution Order
Phases run sequentially 1 → 8. Each phase ends with a short status note; you can pause, redirect, or accept and continue at any boundary.
