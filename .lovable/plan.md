## Goal

Make the multiclass/level-up logic that was recently shored up (the tested `commitLevelUp` write contract) actually visible and trustworthy to players and DMs — and route the wizard's final write through that same function so the UI and tests share one code path.

## Scope

Four visual surfaces + one logic refactor, applied everywhere a character is shown.

---

### 1. LevelUpWizard "what's changing" preview (Player)

A new **Review** step inserted just before the final Confirm button.

- **Class delta** — "Wizard 2 → 3" with a soft brass arrow
- **Hit points** — old max → new max, with the roll/average choice that produced it
- **Hit dice** — "+1d6 Wizard"
- **Spell slots** — diff rows ("Level 2: 3 → 3", "Level 3: 0 → 2 *new*")
- **New features** — bullet list from `srd_class_features` / `srd_subclass_features` at the new level
- **ASI/Feat** — if applicable, show the chosen ability bumps or feat name

Reads from the same plan object the new commit function consumes, so the preview is literally the diff that will be written.

### 2. Class lineup badge (Character Sheet header + everywhere a character appears)

Replace flat `Level 5` with a class-breakdown pill row:

```text
[ Fighter 3 ] [ Wizard 2 ]   Total 5
```

- Primary class first, brass accent
- Subclass tucked under name when chosen (e.g. *Fighter 3 — Champion*)
- Single source: `getClassBreakdownLabel` from `src/lib/character/classes.ts`

Applied to:
- `CharacterSheet` header
- `CharacterCard` (character list, party roster)
- `PartyRoster` (DM view)
- `PlayerProfile` / Player Hub character chip
- `SessionDM` initiative row tooltip + `SessionPlayer` self-card
- `CharacterSheetPage` sticky top bar (next to Level Up button)

### 3. Spell slot tracker grouping (Character Sheet + Player Hub)

Currently slots render as one flat row. New layout:

- **Multiclass slots** section — slots 1-9 derived from the multiclass caster table
- **Pact Magic** section (Warlock only) — separate row with refresh-on-short-rest label
- **Mystic Arcanum** section (Warlock 11+) — already exists, just visually nested under Pact Magic
- Subtle divider + section header in Cinzel

Updates `SpellSlotTracker.tsx` and `PlayerSpellbook.tsx`.

### 4. Level history timeline (Character Sheet — new "History" subtab)

A vertical timeline reading from `character_level_history`:

```text
●  Level 5  ·  Wizard 2 → 3        +1d6 HP  ·  Level 3 slots unlocked
●  Level 4  ·  Took Wizard 1       multiclass — Int 13 prereq met
●  Level 3  ·  Fighter 2 → 3       Champion subclass chosen
```

Lives on the character sheet as a collapsible section (desktop sidebar / mobile new tab).

### 5. Wire LevelUpWizard → commitLevelUp (single source of truth)

Refactor the wizard's final confirm handler:

- Build a `LevelUpPlan` object from wizard state (already mostly assembled for the Review step in #1)
- Replace inline Supabase writes with a single `await commitLevelUp(plan, supabaseDb)` call
- Keep wizard's "side effect" writes that aren't in commit scope (custom feature picks, prepared-spell deltas, ASI ability updates) as a separate pre-step inside a transaction-ish sequence
- Add a `LevelUpWizard.integration.test.tsx` smoke test that mounts the wizard, clicks through Fighter 3 → 4, and asserts `commitLevelUp` was called with the right plan

---

## Build order (smallest blast radius first)

1. **Class lineup badge component** — pure presentational, ship to all 6 surfaces
2. **Spell slot grouping** — visual restructure only, no data changes
3. **LevelUpWizard Review step** — adds a step but no commit-path change yet
4. **Wire commitLevelUp** — swap the writes, add smoke test
5. **Level history timeline** — last because it's a new subtab, lowest risk if delayed

Each step ships independently so you can sanity-check the preview after every milestone.

---

## Technical notes

- No DB migrations. Everything already exists: `character_classes`, `character_spell_slots`, `character_level_history`, `srd_class_features`, `srd_subclass_features`.
- `commitLevelUp` already lives at `src/lib/character/levelUp.ts` with 8 passing tests covering the four multiclass scenarios.
- Lineup badge reuses existing `getCharacterClasses` + `getClassBreakdownLabel` helpers.
- Review step's slot-diff math comes from reusing the multiclass slot table already referenced in `commitLevelUp` reconciliation logic.
- Honor existing tokens: ivory parchment bg, brass accents, Cinzel headers. No new color tokens.
- Honor "Desktop-first responsive" core memory: timeline is sidebar on desktop, tab on mobile.

## Out of scope

- Changing 5e rule math (HP averages, slot tables, prereqs) — already correct
- Touching Warlock Pact Magic mechanics — only visual grouping
- Multiclass spell preparation rebalancing — separate epic
- Animations beyond existing magic-glow press effects
