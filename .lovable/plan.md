# Level Up Access — Mobile-First Plan

**Goal**: Make leveling up obvious and reachable from every place a character is shown, optimized for the 411px viewport you're on.

---

## Phase 1 — Character Sheet Page (primary fix)
`src/pages/CharacterSheetPage.tsx`

- Add a **sticky mobile action bar** at the top of the page (below the BackButton) with a full-width **"Level Up"** button (icon + label, 44px tall).
- Owner-only: only show when `character.user_id === auth.uid()`.
- Mount `<LevelUpWizard />` at the page level so it works regardless of which inner sheet variant renders.
- After level-up completes, refresh character data (no full reload).
- Disable/hide the button when at level 20.

## Phase 2 — Character Card (list views)
`src/components/character/CharacterCard.tsx`

- Replace the tiny unlabeled `TrendingUp` icon-only button with an **icon + "Level Up" label** button on mobile (full width below "View Sheet"), collapsing back to icon-only on `sm+`.
- When XP threshold is reached, add a pulsing **brass glow ring** + small "Ready!" badge on the button to draw the eye on the card grid.

## Phase 3 — XP Bar becomes the trigger
`src/components/character/XPProgressBar.tsx`

- Accept an optional `onLevelUp?: () => void` prop.
- When `isLevelUpReady` is true and the prop is provided, render the **"LEVEL UP!" badge as a tappable button** (44px touch target, full-width on mobile) that calls `onLevelUp`.
- Wire it through `PlayerCharacterSheet` and the new `CharacterSheetPage` action so tapping the bar opens the wizard.

## Phase 4 — Mobile Bottom Nav signal
`src/components/player/MobileBottomNav.tsx`

- Add a small **brass dot badge** on the "Chars" item when any of the player's characters has `current_xp >= next_threshold`.
- Lightweight query on mount (player's characters, just `id, level, current_xp`); no realtime needed for v1.
- Tapping "Chars" already routes to `/player/:playerId/characters`, where the glowing card from Phase 2 will guide them in.

## Phase 5 — Player Character Sheet header
`src/components/player/PlayerCharacterSheet.tsx`

- Move the existing Level Up button out of the bottom of the left column into the **sticky character header** as a primary action (full-width on mobile, inline on desktop), so it's reachable without scrolling.

---

## Verification (mobile, 411px)
- Direct-land `/characters/:id` → Level Up button visible without scrolling.
- Card grid at `/player/:playerId/characters` → eligible characters glow + show "Ready!" badge.
- XP bar with full XP → tapping the badge opens the wizard.
- Bottom nav "Chars" shows a dot when any character is ready.
- All new tap targets ≥ 44×44px; no layout shift under the DemoBar (uses `--demo-bar-offset`).

## Out of scope
- Auto-awarding XP on quest/encounter completion.
- DM-side bulk XP grants UI (already exists in session tools).
