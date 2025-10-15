# Combat Components Inventory

## Phase 0: Component Classification (DM-only vs Player vs Shared)

Last updated: Phase 0

---

## 🎯 DM-ONLY Components

These components contain mutations, privileged data, or controls that only the DM should access:

### Core Combat Control
- **`src/pages/SessionDM.tsx`** - Main DM screen with full campaign control
  - Start/End Combat
  - Apply Damage/Healing to any character
  - Send Save Prompts
  - View all character stats

### Monster Management
- **`src/components/monsters/MonsterRoster.tsx`** - Monster HP management and removal
- **`src/components/monsters/MonsterLibraryDialog.tsx`** - Add monsters to encounters
- **`src/components/monsters/MonsterImportDialog.tsx`** - Import SRD monsters
- **`src/components/monsters/MonsterDetailDialog.tsx`** - View full monster stats
- **`src/components/monsters/MonsterActionDialog.tsx`** - Execute monster actions
- **`src/components/monsters/MonsterHomebrewDialog.tsx`** - Create custom monsters (if exists)

### Combat Actions & Effects
- **`src/components/combat/DamageInput.tsx`** - Apply damage/healing to combatants
- **`src/components/combat/EffectDialog.tsx`** - Create and manage effects
- **`src/components/combat/EffectsList.tsx`** - View all active effects
- **`src/components/combat/ConcentrationTracker.tsx`** - View concentration status
- **`src/components/combat/ConditionsManager.tsx`** - Apply/remove conditions
- **`src/components/combat/SavePromptDialog.tsx`** - Create save prompts

### Initiative Control
- **`src/components/combat/InitiativeTracker.tsx`** - Full initiative management
  - Add/remove combatants
  - Advance turns
  - View all combatant stats

### Character Management
- **`src/components/character/CharacterCreationDialog.tsx`** - Create NPCs/PCs
- **`src/components/character/RestManager.tsx`** - Trigger rests for party

---

## 👥 PLAYER Components

These components should be available to players to interact with their own character:

### Character Selection & Status
- **`src/components/character/CharacterSelectionDialog.tsx`** - Select which character to play
- **`src/pages/SessionPlayer.tsx`** - Player view (to be created/enhanced)

### Player Actions (Self-only)
- **`src/components/combat/SavePromptSubmit.tsx`** - Submit saving throws
- **`src/components/combat/SavePromptListener.tsx`** - Listen for save requests

### Player View Components (Read-only or Self-modify)
- Death saves (to be created)
- Self damage/healing (to be created)
- Personal effects view (to be created)
- Personal conditions (to be created)

---

## 🔄 SHARED Components (Both DM & Player)

These components display information without privileged mutations:

### Display-Only
- **`src/components/combat/CombatLog.tsx`** - View combat events (filtered for players)
- **`src/components/combat/SaveResults.tsx`** - View save outcomes
- **`src/components/combat/SavePromptsList.tsx`** - View active save prompts
- **`src/components/dice/DiceRoller.tsx`** - Roll dice (utility)

### Maps (with permission filtering)
- **`src/components/maps/MapViewer.tsx`** - View battle map
- **`src/components/maps/TokenManager.tsx`** - DM: manage tokens, Player: view only
- **`src/components/maps/FogOfWarTools.tsx`** - DM-only fog control
- **`src/components/maps/AoETools.tsx`** - DM-only AoE placement
- **`src/components/maps/MapUpload.tsx`** - DM-only map upload

### Navigation
- **`src/components/BottomNav.tsx`** - Navigation bar (role-aware links)
- **`src/components/presence/PlayerPresence.tsx`** - Show who's online

### Handouts & Quests (Permission-filtered)
- **`src/components/handouts/HandoutViewer.tsx`** - View revealed handouts
- **`src/components/handouts/HandoutDialog.tsx`** - DM: create, Player: view
- **`src/components/quests/QuestLog.tsx`** - View active quests
- **`src/components/quests/QuestDialog.tsx`** - DM: create/edit, Player: view

### NPCs & Loot (Read-only for players)
- **`src/components/npcs/NPCDirectory.tsx`** - View NPCs
- **`src/components/npcs/NPCDialog.tsx`** - DM: edit, Player: view
- **`src/components/loot/LootPool.tsx`** - View/claim loot
- **`src/components/loot/LootItemDialog.tsx`** - DM: add loot, Player: view

---

## 🔧 HOOKS & UTILITIES

### Combat Hooks
- **`src/hooks/useCombatActions.ts`** - DM-only mutations (damage, healing, initiative)
  - ⚠️ **Needs RLS validation** - Currently relies on client-side role checks
- **`src/hooks/useEncounter.ts`** - Encounter state management (shared, but mutations DM-only)
- **`src/hooks/use-toast.ts`** - UI notifications (shared)
- **`src/hooks/use-mobile.tsx`** - Responsive layout helper (shared)

### Libraries
- **`src/lib/damageEngine.ts`** - Damage calculation logic (server-side preferred)
- **`src/lib/dnd5e.ts`** - D&D 5e rules reference (shared)
- **`src/lib/validation.ts`** - Input validation schemas (shared)
- **`src/lib/rateLimiter.ts`** - Rate limiting (server-side)

---

## 🔐 SECURITY CONSIDERATIONS

### Current State
- ✅ RLS policies exist for most tables
- ⚠️ **Action**: Need to audit `useCombatActions` - ensure server validates DM role
- ⚠️ **Action**: Player view should filter combat log to "public" events only
- ⚠️ **Action**: Map fog-of-war should be enforced server-side

### Required RLS Checks
1. **Initiative mutations** - Only DM can add/remove/advance
2. **Damage/Healing** - Only DM can apply to others; players to self only
3. **Effects & Conditions** - Only DM can create/remove
4. **Monster data** - Players should see limited stats (no hidden traits)
5. **Save prompts** - Only DM can create; players can only submit for own character

---

## 📋 PHASE 0 CHECKLIST

- [x] Create shared type definitions (`types/combat.ts`)
- [x] Create seed data utility (`data/seedCombatData.ts`)
- [x] Document component ownership (this file)
- [ ] Eliminate `any` types in combat code
- [ ] Add TypeScript strict mode to combat components
- [ ] Create dev-only seed button in UI
- [ ] Test seeded encounter loads correctly
- [ ] No console errors on load

---

## 🚀 NEXT STEPS (Phase 1)

After Phase 0 stabilizes:
1. Add "Start Combat" button (sets first combatant as current turn)
2. Add "End Round" explicit button
3. Implement keyboard hotkeys (`[`, `]`, `R`)
4. Improve current turn highlighting
5. Add round counter badge
