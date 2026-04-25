## Navigation, Auth & Mobile Companion Overhaul

A comprehensive audit and fix-up of site-wide wayfinding for both Players and Campaign Managers (DMs), with a heavy focus on making the **mobile companion** (≤768px) a first-class experience. Work is grouped into four phases that can ship in sequence; phases 1–3 are tightly coupled and recommended as one batch, phase 4 follows.

---

### Phase 1 — Critical Routing, Auth & Visibility Fixes
**Goal:** Stop sending users to the wrong place; show them all the campaigns they belong to.

- **Auth redirect capture (`src/pages/Auth.tsx`)**
  - Read `?redirect=` query param (and `location.state.from`) on mount.
  - After successful sign-in / sign-up, navigate to that destination instead of `/`.
  - Update every "you must sign in" guard (`PlayerHub`, `CampaignHub`, `CharacterSheetPage`, `PlayerCampaignView`) to push the current path as `?redirect=` when bouncing to `/auth`.
- **Broken back-link in `CharacterSheetPage.tsx`**
  - Fix `/campaign/...` → `/campaigns/...` (or to the correct campaign-manager route in this codebase — verify against `App.tsx` route table during implementation).
- **Player-aware Campaign Hub (`src/pages/CampaignHub.tsx`)**
  - Today only fetches `campaigns.dm_user_id = userId`. Extend to also fetch campaigns where the user is a member via `campaign_members` / `player_campaign_links`.
  - Render two sections: **Campaigns I run** and **Campaigns I play in** (hide either if empty). Each tile routes appropriately (manager view vs. player view).
- **Demo bar / mobile header collision**
  - `DemoBar` is `fixed` and overlaps the sticky mobile header in `CampaignManagerLayout` and `PlayerPageLayout`. Add a `--demo-bar-offset` CSS var (or conditional `pt-*`) so headers stack below it on all viewports.
- **`PlayerNavigation` DM detection**
  - Replace the inline `select id from campaigns where dm_user_id = userId` with the existing `useIsDM` pattern generalized to "is DM of any campaign," so the Campaign Hub link appears for the right people.

---

### Phase 2 — Unified Back / History Navigation
**Goal:** Every interior page has a sensible "back" affordance; no dead ends.

- **New `<BackButton />` component** (`src/components/ui/back-button.tsx`)
  - Props: `fallback: string`, optional `label`.
  - Behavior: if `window.history.length > 1` and the previous entry is same-origin, call `navigate(-1)`; otherwise navigate to `fallback`.
  - Visual: ghost button, brass hover, 44×44px tap target, left-chevron + label on ≥sm, icon-only on xs.
- **Adopt across:**
  - `PlayerCharactersPage`, `PlayerCharacterViewPage`, `CharacterSheetPage`, `Notes`, `PlayerNotes`, `Inventory`, `Lore`, `CampaignTimeline`, `WorldMap`, `CombatMap`, `Community`, `Changelog`, `PlayerSettings`, `BetaTools*`.
  - Each page gets a top-left back button wired to the most logical fallback (player dashboard / campaign hub / index).
- **Breadcrumb-lite for deep player views**
  - On `PlayerCampaignView` sub-tabs and `CharacterSheetPage`, render a small "Player Hub › {Campaign} › {Section}" trail under the header on ≥md.

---

### Phase 3 — Mobile Companion Optimization (the big one)
**Goal:** Everything a player needs at the table is one tap away on a phone, and never requires horizontal scrolling.

- **Persistent mobile bottom navigation**
  - New `<MobileBottomNav />` rendered by `PlayerPageLayout` (and a thin variant by `CampaignManagerLayout` for DMs in field-mode).
  - Player items: **Dashboard · Characters · Active Campaign · Notes · More**. "More" opens the existing left drawer for Settings / Community / Campaign Hub / Sign out.
  - DM items: **Hub · Campaigns · Sessions · Notes · More**.
  - 56px tall, safe-area-inset aware (`pb-[env(safe-area-inset-bottom)]`), hidden on `md:` and up. Add matching `pb-20 md:pb-0` to scroll containers so content isn't covered.
- **Tab overflow → mobile picker**
  - `PlayerCampaignView` (and any tab-strip with > ~5 tabs: Lore, NPCs, Locations, Quests, Factions, Timeline, Maps, Notes, Journal, Combat, Chat, etc.) currently overflows horizontally on a 411px viewport.
  - On `<md`, replace the horizontal `<TabsList>` with a sticky `<Select>` dropdown showing the current tab and section icon. Keep `<TabsContent>` as-is so state is preserved. On `≥md`, keep the existing horizontal tabs.
  - Same treatment for any `CampaignManager` 17-tab strip.
- **Touch target & padding pass**
  - Audit buttons/links inside `PlayerCharacterSheet`, `PlayerCombatActions`, `PlayerSpellbook`, `PlayerInventory`, `DeathSavingThrows`, `PlayerInitiativeDisplay`. Minimum 44×44px hit area; bump icon-only buttons from `size="icon"` (h-9 w-9) to a new `size="icon-touch"` (h-11 w-11) on mobile via responsive class.
  - Standardize page padding to `px-3 sm:px-4 md:px-6` and section spacing to `space-y-4 md:space-y-6` so phones don't waste edge real estate.
- **Single-page character sheet on mobile**
  - `PlayerCharacterSheet` currently splits into tabs (Stats / Combat / Spells / Features / Inventory / Notes). On `<md`, render as one continuous, sectioned, collapsible page with sticky section headers (Stats, Combat, Spells, Features, Inventory, Notes). Each section is an `<details>`-style collapsible (open by default for Stats + Combat) so a player can scroll/scan everything in one view but still collapse what they don't need.
  - Keep tabbed layout on tablet/desktop unchanged.
- **Mobile-friendly headers**
  - `PlayerPageLayout` mobile header gets: hamburger (existing) · page title · contextual right-side action slot (e.g., "+" on character list, "Roll" on sheet). Title truncates with `min-w-0 truncate`.
- **Demo pages parity**
  - Apply the same bottom-nav + tab-picker treatment to `DemoCampaignHub` / `DemoCampaignManager` so the marketing demo feels identical to the real product on a phone.

---

### Phase 4 — Wayfinding Polish & Role-Aware Home
**Goal:** First-time and returning users land where they want with one tap.

- **`Index.tsx` (home / landing)**
  - When signed-in: show a prominent "Continue" panel with role-aware CTAs:
    - DM with campaigns → "Open Campaign Hub" + recent-campaign tile.
    - Player with characters → "Open Player Dashboard" + last-played character tile.
    - New user → "Create your first character" / "Start a campaign" / "Try the demo".
  - When signed-out: keep current marketing hero, but make the primary CTAs route to `/auth?redirect=/player` and `/auth?redirect=/campaign-hub` so post-login lands correctly.
- **Sign-up flow tightening**
  - Confirm `Auth.tsx` uses `emailRedirectTo: ${window.location.origin}/auth` (so the verification link returns into the app and then the redirect-capture from Phase 1 forwards them on).
  - Add an inline "Try the demo instead" link on `/auth` that goes to `/demo`.
- **Empty-state CTAs**
  - `CampaignHub` (no campaigns), `PlayerCharactersPage` (no characters), `Notes` (no notes) — each gets a friendly empty state with one primary action button matching the page's purpose.

---

### Files Touched (high level)
| Area | Key files |
|------|-----------|
| Auth & redirects | `src/pages/Auth.tsx`, `src/contexts/AuthContext.tsx`, every page with a sign-in guard |
| Routing fixes | `src/pages/CharacterSheetPage.tsx`, `src/pages/CampaignHub.tsx`, `src/App.tsx` (verification only) |
| Layouts | `src/components/player/PlayerPageLayout.tsx`, `src/components/player/PlayerNavigation.tsx`, `CampaignManagerLayout.tsx`, `src/components/demo/DemoBar.tsx` |
| New components | `src/components/ui/back-button.tsx`, `src/components/player/MobileBottomNav.tsx`, `src/components/ui/MobileTabPicker.tsx` |
| Mobile sheet | `src/components/player/PlayerCharacterSheet.tsx` (responsive split) |
| Tabs to picker | `src/pages/PlayerCampaignView.tsx`, campaign-manager tab host |
| Home | `src/pages/Index.tsx` |

### Out of Scope
- Visual redesign of the parchment/brass aesthetic (mechanics-only mobile pass).
- Backend/RLS changes (Phase 1 only reads; no schema migrations).
- New features beyond navigation (no new tabs, no new pages).
- Push notifications / PWA install prompt (separate effort).

### Acceptance Checks
- A signed-out user clicking a deep link (e.g., `/player/abc/characters`) lands back on that exact page after sign-in.
- A user who is a player in Campaign A and DM of Campaign B sees both on `/campaign-hub` (or appropriate hubs).
- On a 411×734 viewport, no page requires horizontal scrolling; every primary action is reachable with a thumb; bottom nav never overlaps content; demo bar never overlaps the header.
- Every interior page has a working back button that returns to a sensible parent.
- Character sheet on mobile reads top-to-bottom in one collapsible page; on desktop the tabbed layout is unchanged.

### Execution Order
Phases 1 → 2 → 3 in one batch, then Phase 4 as a follow-up. Each phase ends with a short status note so you can pause, redirect, or accept and continue.
