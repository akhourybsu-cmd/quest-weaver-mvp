

# Session Kiosk: An Integrated Live-Session Experience

## Concept

Instead of navigating players away to a separate `/session/player` page, the live session experience becomes an animated **kiosk panel** that slides open from within the `PlayerCampaignView`. The player stays in context -- their campaign page is always "home base" -- and the session tools float on top or beside it.

- **Desktop**: A slide-in side panel (using the existing Sheet or a resizable panel) anchored to the right, roughly 50-60% width, with all session tabs inside it.
- **Mobile/PWA**: A full-screen bottom-up drawer (using Vaul's Drawer, already installed as `vaul`) that takes over the viewport, with a drag handle to minimize.

The existing `SessionPlayer.tsx` page content gets extracted into a reusable `SessionKiosk` component, and the standalone route remains as a fallback/direct-link entry point that simply wraps the same kiosk full-screen.

## How It Works for the Player

1. Player is on their campaign page (`/player/campaign/:code`)
2. Session goes live -- the "Join Session" button appears (already implemented)
3. Player taps "Join Session" -- instead of navigating away, the kiosk **slides open** with a smooth animation
4. All session tools (character sheet, combat, spells, inventory, chat, map, etc.) are inside the kiosk
5. Player can **minimize** the kiosk (swipe down on mobile, click collapse on desktop) to glance at campaign info underneath
6. When the DM ends the session, the kiosk shows the "Session Ended" card inline and auto-closes after acknowledgment

## Visual Layout

```text
DESKTOP (side-by-side)
+---------------------------+------------------------------+
| PlayerCampaignView        |  SessionKiosk (Sheet)        |
| (campaign tabs:           |  [x close]                   |
|  quests, NPCs, lore...)   |  Character header strip      |
|                           |  [Tabs: Char|Combat|Spells|  |
|                           |   Features|Journal|Quests|   |
|                           |   Inventory|Chat|Map]        |
|                           |  [Tab content...]            |
+---------------------------+------------------------------+

MOBILE (full-screen drawer)
+---------------------------+
| [--- drag handle ---]     |
| SessionKiosk              |
| Character header strip    |
| [Tabs]                    |
| [Tab content...]          |
+---------------------------+
```

## Implementation Plan

### Step 1: Create `SessionKiosk` component

Extract all session UI logic from `SessionPlayer.tsx` (lines 452-656) into a new `src/components/session/SessionKiosk.tsx` component. This component receives `campaignId`, `campaignCode`, `currentUserId`, and `character` as props (no routing, no auth fetching -- that stays in the parent).

It contains:
- The session header strip (character name, "In Combat" indicator)
- All 10 tab panels (Character, Combat, Spells, Features, Journal, Profile, Quests, Inventory, Chat, Map)
- The SavePromptListener
- PlayerPresence
- The real-time encounter/initiative subscriptions
- The "Session Ended" overlay (rendered inline within the kiosk)

The kiosk does NOT include: auth checks, campaign code resolution, navigation back buttons, or the outer page shell -- those stay in the parent.

### Step 2: Create `SessionKioskContainer` wrapper

Create `src/components/session/SessionKioskContainer.tsx` that handles the kiosk's open/close state and animation:

- On **desktop**: Uses the existing Radix `Sheet` component (side="right", with a wide width like `max-w-2xl w-[55vw]`) for a slide-in panel
- On **mobile**: Uses the existing `vaul` Drawer component (already in dependencies) for a full-screen bottom-up sheet with a drag handle
- Entrance animation uses `animate-slide-in-right` on desktop, Vaul's built-in spring animation on mobile
- When opened, it initializes the session data (single combined query + `Promise.all`, same optimized pattern from the recent overhaul)
- A prominent floating action button (FAB) appears on the campaign view when a session is live, pulsing with the existing `pulse` animation class

### Step 3: Integrate into `PlayerCampaignView`

Modify `PlayerCampaignView.tsx`:
- Add a `kioskOpen` state
- When `sessionStatus` is `live` or `paused`, render a floating "Join Session" FAB in the bottom-right corner (animated pulse when live)
- Clicking it sets `kioskOpen = true` and renders `SessionKioskContainer`
- The existing "Join Session" button in the header also opens the kiosk instead of navigating
- Subscribe to the `campaigns` table for real-time session-end detection (reuse existing pattern) to auto-close the kiosk when session ends

### Step 4: Slim down `SessionPlayer.tsx` to a thin wrapper

Keep the `/session/player` route as a direct-link fallback (e.g., for shared URLs). But instead of duplicating all session UI, it simply renders `SessionKiosk` full-screen with a back button. All the heavy lifting is in the shared `SessionKiosk` component.

### Step 5: Animated entrance and polish

- Desktop kiosk slides in from the right with `animate-slide-in-right` (0.3s ease-out)
- Mobile drawer uses Vaul's spring animation (already built-in)
- The FAB has a breathing glow animation when session is live (uses existing `pulse` class + a brass border-glow)
- When combat starts mid-session, the Combat tab auto-activates with a brief scale-in flash
- "Session Ended" overlay uses `animate-fade-in` with a gentle scale

## Files Changed

- **NEW**: `src/components/session/SessionKiosk.tsx` -- extracted session UI (tabs, subscriptions, combat tracking)
- **NEW**: `src/components/session/SessionKioskContainer.tsx` -- Sheet/Drawer wrapper with open/close logic and FAB
- **MODIFIED**: `src/pages/PlayerCampaignView.tsx` -- integrate kiosk, replace navigate-away join with kiosk open, add FAB
- **MODIFIED**: `src/pages/SessionPlayer.tsx` -- slim down to thin wrapper around `SessionKiosk`

### No database changes required

All changes are in the React/TypeScript UI layer. The same real-time subscriptions, queries, and session validation logic are reused -- just reorganized into the kiosk component.

