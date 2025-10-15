# D&D Combat Tracker - Phase Status Summary

## ✅ **Completed Phases (0-7)**

### **Phase 0 — Baseline & Stabilize**
**Status**: ✅ Complete
- Strict TypeScript types in `src/types/combat.ts`
- Seed combat data for testing (`src/data/seedCombatData.ts`)
- Component inventory documented
- Zero console errors on boot

### **Phase 1 — Turn Engine & Initiative UI**
**Status**: ✅ Complete
- Start Combat button
- Prev/Next Turn controls with keyboard shortcuts (`[` `]`)
- Round badge display
- Current turn highlighting
- Auto-increment round on wrap

### **Phase 2 — HP, Damage/Healing, Concentration, Death Saves**
**Status**: ✅ Complete
- Apply damage/healing from UI
- Auto concentration check on damage (CON save prompt)
- Death save tracking (3 success / 3 fail)
- Temp HP handling
- Database schema updated with death save fields

### **Phase 3 — Effects, Conditions, Resist/Vuln/Immune**
**Status**: ✅ Complete
- Quick-apply conditions popover
- Effect duration tracking
- RVI math centralized (server-side)
- RVI tooltips showing damage modifiers

### **Phase 4 — Action Economy & Short-Rest Resources**
**Status**: ✅ Complete
- Action/Bonus/Reaction tracking with auto-reset on turn
- Resource chips (Hit Dice, Ki, Sorcery Points, etc.)
- Inspiration toggle
- Database: `resources` JSONB field

### **Phase 5 — Session Management & Player View**
**Status**: ✅ Complete
- Encounter lifecycle (preparing → active → paused → ended)
- Player character sheet with real-time sync
- "Need Ruling" system for player→DM communication
- Real-time HP/condition/effect sync

### **Phase 6 — Spell & Resource Tracking**
**Status**: ✅ Complete
- Visual spell slot tracking with dot indicators
- Class resource tracking with reset timing
- Resource setup dialog for configuration
- Integration with rest system (short/long rest)

### **Phase 7 — Advanced Maps & Tactical Tools**
**Status**: ✅ Complete
**Components Created:**
- `MeasurementTool.tsx` - Distance measurement in feet
- `GridSnapToggle.tsx` - Grid snapping for tokens
- `RangeIndicator.tsx` - Spell/ability range circles
- `TerrainMarker.tsx` - Terrain type markers (difficult, water, fire, hazard)
- `AdvancedFogTools.tsx` - Dynamic fog painting (reveal/hide)

**Integration:**
- ✅ All tools integrated into `/map` page (CombatMap component)
- ✅ Navigation fixed from SessionDM → Map tab
- ✅ DM-only tool overlays positioned around map canvas
- ✅ Grid snapping implemented in TokenManager
- ✅ Tool mutual exclusivity (only one active at a time)

**Access:**
- DMs click "Map" tab in SessionDM → "Open Battle Map" button
- Navigate to `/map?campaign={id}&dm=true&encounter={id}`

---

## 🚧 **Next Phases (9-16)**

### **Phase 8 — Permissions, Presence, Spectator Mode** ✅ COMPLETE
**Goals:**
- Enforce DM-only actions via UI + RLS
- Real-time presence (who's online, whose turn)
- Spectator read-only "table TV" mode

**Completed:**
- ✅ Created TurnIndicator component showing current turn + awaiting saves
- ✅ Built SessionSpectator page (read-only combat view)
- ✅ Added spectator route `/session/spectator`
- ✅ RLS policies reviewed (1 warning: leaked password protection)
- ✅ Turn indicator integrated into SessionDM

**Access:**
- Spectator: `/session/spectator?campaign={code}`
- Shows initiative order, current turn, HP bars (for monsters), combat log
- No edit controls, read-only view perfect for "table TV"

---

### **Phase 9 — Combat Log 2.0 + Undo/Redo** ⬅️ NEXT
**Goals:**
- Structured combat log (JSON payload)
- Undo last step (server applies inverse mutation)
- Export log (markdown/JSON)

**Tasks:**
- [ ] Enhance combat_log with structured `details` JSONB
- [ ] Create undo edge function (reverse HP/effect mutations)
- [ ] Add export button (download MD/JSON report)
- [ ] Log viewer with expand/collapse for payload

---

### **Phase 10 — Reliability & UX Smoothness**
**Goals:**
- Optimistic UI for HP/conditions
- Debounced Supabase writes
- Retry with backoff for transient errors

---

### **Phase 11 — Testing & Fixtures**
**Goals:**
- Unit tests for damage pipeline, concentration DC, death saves
- Integration tests for turn advance + effect tick
- E2E happy-path (start → fight → end)

---

### **Phase 12 — Performance**
**Goals:**
- Virtualize long lists (initiative, log)
- Scope Supabase subscriptions tightly
- Memoize expensive selectors

---

### **Phase 13 — Security & Quotas**
**Goals:**
- Tighten RLS (players only mutate self)
- Edge function rate limits
- Idempotency keys for actions

---

### **Phase 14 — Telemetry & Analytics**
**Goals:**
- Event pings (encounter_start, round_start, etc.)
- Error + latency traces

---

### **Phase 15 — Polish & Accessibility**
**Goals:**
- Mobile-first layout
- A11y (keyboard nav, aria labels)
- Color-blind safe indicators

---

### **Phase 16 — Documentation & Onboarding**
**Goals:**
- In-app "DM Quickstart" overlay
- Tooltips for condition icons
- House rules toggles documentation

---

## 📊 Current State Assessment

### ✅ Working Features
- ✅ Full turn cycle with keyboard shortcuts
- ✅ HP tracking with temp HP and death saves
- ✅ Auto concentration checks on damage
- ✅ Quick condition application
- ✅ RVI damage calculations (server-side)
- ✅ Action economy tracking (Action/Bonus/Reaction)
- ✅ Resource management (spell slots, class resources)
- ✅ Encounter lifecycle management
- ✅ Player character sheet with real-time sync
- ✅ Need ruling system
- ✅ Advanced map tools (measurement, range, terrain, fog)
- ✅ Grid snapping for tokens

### ⚠️ Known Gaps
- Effect auto-tick on round advance (partially implemented)
- Condition auto-expiry at end round
- Long/Short rest edge function integration
- Undo/redo system
- Combat log export
- Performance optimization for large encounters

### 🔒 Security Status
- RLS policies exist for all tables
- Edge functions use service role for mutations
- DM-only UI controls in place
- **TODO**: Full security audit (Phase 13)

---

## 🎯 Recommended Next Steps

1. **Phase 8**: Harden permissions and add spectator mode
2. **Phase 9**: Implement undo/redo for DM quality of life
3. **Phase 10**: Add optimistic UI for smoother feel
4. **Phase 11**: Write tests to ensure reliability
5. **Phase 12+**: Polish and scale

---

## 📁 Key Files

### Components
- `src/components/combat/InitiativeTracker.tsx` - Main combat UI
- `src/components/combat/CombatLog.tsx` - Event stream
- `src/components/combat/ActionEconomy.tsx` - Turn budget tracking
- `src/components/combat/ResourceChips.tsx` - Class resources
- `src/components/maps/` - All Phase 7 map tools

### Hooks
- `src/hooks/useCombatActions.ts` - Damage/healing actions
- `src/hooks/useEncounter.ts` - Encounter state management

### Edge Functions
- `supabase/functions/apply-damage/` - Damage with RVI
- `supabase/functions/apply-healing/` - Healing with log
- `supabase/functions/advance-turn/` - Turn progression
- `supabase/functions/create-save-prompt/` - Save prompts
- `supabase/functions/record-save-result/` - Save resolution

### Types
- `src/types/combat.ts` - All combat TypeScript definitions

---

**Last Updated**: Current Session
**Phase Progress**: 8/16 Complete (50%)
