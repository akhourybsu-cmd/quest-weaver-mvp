# Phase 1 & 2 Complete

## Phase 1 — Turn Engine & Initiative UI ✅

**Completed Features:**
- ✅ Start Combat button when no `is_current_turn` exists
- ✅ Prev/Next Turn controls with visual feedback
- ✅ Round badge display in header
- ✅ Current turn highlighting (primary border)
- ✅ Keyboard shortcuts: `[` for previous, `]` for next turn
- ✅ Stable initiative ordering with proper tie-breaking (initiative → dex → perception → created_at)

**Implementation Details:**
- Added `handleStartCombat()` to set first combatant as current turn
- Keyboard event listeners respect input focus (don't trigger when typing)
- Turn controls disabled appropriately based on combat state
- Initiative sorted consistently using multiple tiebreakers

## Phase 2 — HP, Damage/Healing, Concentration, Death Saves ✅

**Completed Features:**
- ✅ Apply damage/healing from UI (DM & Monster actions)
- ✅ Auto concentration check on damage (CON save prompt created automatically)
- ✅ Death save tracking (3 success / 3 fail, stabilize, reset on heal)
- ✅ Temp HP handling (absorbed before real HP damage)
- ✅ Database schema updated with death save fields

**Database Migrations:**
```sql
ALTER TABLE characters
  ADD COLUMN death_save_success INTEGER DEFAULT 0,
  ADD COLUMN death_save_fail INTEGER DEFAULT 0,
  ADD COLUMN inspiration BOOLEAN DEFAULT false,
  ADD COLUMN temp_hp INTEGER DEFAULT 0;
```

**Implementation Details:**

### Concentration Checks
- `apply-damage` edge function returns `concentrationCheck` object when damage dealt to concentrating character
- `useCombatActions.applyDamage()` auto-creates CON save prompt with DC = max(10, dmg/2)
- Prompt description includes effect names requiring concentration

### Death Saves
- New `DeathSaveTracker` component displays when character HP = 0
- Tracks successes/failures with visual indicators
- Natural 20: regain 1 HP and clear saves
- Natural 1: 2 failures
- DC 10: success on 10+, failure on <10
- "Stabilize" button to manually stabilize character
- Healing automatically clears death saves

### Temp HP
- Already implemented in `apply-damage` edge function
- Temp HP absorbed before real HP damage
- Damage steps show temp HP absorption in log

## Next Steps

**Phase 3 — Effects, Conditions, Resist/Vuln/Immune (RVI)**
- Quick-apply conditions popover from initiative rows
- Effect duration tracking per round; auto tick at round start
- Confirm RVI math is centralized (server); show computed breakdown in UI tooltips

**Phase 4 — Action Economy & Short-Rest Resources**
- Track Action / Bonus / Reaction spent per turn; reset on turn start
- Lightweight resource chips: Hit Dice, Superiority, Sorcery, Ki (jsonb store)
- Inspiration toggle (DM visible, player controllable)
