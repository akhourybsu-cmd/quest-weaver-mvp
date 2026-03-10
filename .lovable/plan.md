

## Make Demo Fully Interactive & Self-Contained

### Current State
- Demo creates a unique localStorage instance per user via `createDemo()` — good foundation
- `DemoContext` has an `updateCampaign()` method that persists to localStorage — but **no tabs use it**
- All 16 demo tabs are **read-only displays** — no editing, adding, or deleting
- Demo route **requires authentication** (sits inside the `session` check in App.tsx) — should be public
- No loading screen — demo loads instantly with a simple spinner fallback

### What Needs to Change

**1. Make demo route public (App.tsx)**
Move `/demo/:demoId/campaign` out of the authenticated route block so anyone can try the demo without signing up.

**2. Add a themed loading screen (new `DemoLoadingScreen.tsx`)**
Before the demo campaign manager renders, show a 2-3 second immersive loading screen with:
- Animated parchment/scroll visual with progress steps ("Preparing your campaign folio...", "Populating NPCs...", "Charting locations...")
- Fantasy-themed spinner and campaign name reveal
- Fades into the actual demo manager

**3. Make tabs editable with localStorage persistence**
Upgrade the `DemoContext` to support granular CRUD operations on each entity type. Instead of passing `campaign` as a read-only prop, tabs will use context methods to mutate and auto-save.

Add these methods to `DemoContext`:
- `addEntity(type, entity)` / `updateEntity(type, id, updates)` / `deleteEntity(type, id)`
- Types: `quests`, `npcs`, `locations`, `factions`, `monsters`, `items`, `sessions`, `timeline`, `notes`, `lore`, `encounters`, `party`

**4. Upgrade each tab with edit/add/delete capabilities**

Priority tabs (most impactful for a demo experience):

| Tab | Add New | Edit Existing | Delete |
|-----|---------|---------------|--------|
| NPCs | Add NPC dialog | Click to edit fields in detail dialog | Delete from detail |
| Quests | Add quest card | Edit title/description/objectives, toggle objective completion | Delete quest |
| Locations | Add location card | Edit name/description | Delete location |
| Notes | Add note | Edit note content inline | Delete note |
| Sessions | Add session | Edit title/date | Delete session |
| Items | Add item | Edit name/description/rarity | Delete item |
| Factions | Add faction | Edit description/reputation slider | Delete faction |
| Bestiary | Add monster | Edit stats | Delete monster |
| Encounters | Add encounter | Edit name/monsters | Delete encounter |
| Timeline | Add event | Edit title/description | Delete event |
| Lore | Add lore page | Edit content | Delete page |
| Party | — (view only) | Edit HP values | — |
| Plot Board | — (static demo) | — | — |
| Maps | — (static demo) | — | — |
| DM Tools | — (static demo) | — | — |
| Overview | — (auto-computed) | — | — |

**5. Auto-cleanup on close**
Already works via `cleanupExpiredDemos()` on homepage load. Add a `beforeunload` listener in `DemoContext` to clean up when the browser tab closes (best-effort).

### Files to Create/Modify

- **`src/App.tsx`** — Move demo route to public block
- **`src/components/demo/DemoLoadingScreen.tsx`** — New themed loading screen component
- **`src/pages/DemoCampaignHub.tsx`** — Add loading screen before rendering manager
- **`src/contexts/DemoContext.tsx`** — Add `addEntity`, `updateEntity`, `deleteEntity` methods; add `beforeunload` cleanup
- **11 demo tab files** — Add edit dialogs, add buttons, delete confirmations, all persisting via context
- **`src/lib/demoHelpers.ts`** — Add `beforeunload` cleanup helper

### Technical Approach
- All mutations go through `DemoContext.updateCampaign()` which writes to localStorage
- Each tab gets an "Add" button that opens a pre-filled form dialog
- Clicking existing items opens an edit dialog with save/cancel
- Delete shows a confirmation dialog then removes from the array
- No Supabase calls anywhere in demo — strict localStorage isolation maintained
- `nanoid` used for generating new entity IDs in the demo

### What Does NOT Change
- Real campaign system — completely untouched
- Supabase/database — no demo data ever touches it
- Seed data structure — `RECKONING_SEED` stays the same
- Demo bar (timer, reset, end) — already works correctly

