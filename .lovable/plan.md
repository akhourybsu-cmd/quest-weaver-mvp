

# Session Kiosk UI Polish: Fantasy Aesthetic, Animations, and Creative Transitions

## Overview

The Session Kiosk components (`SessionKiosk`, `SessionKioskContainer`, and `SessionPlayer`) are functionally wired up but visually plain -- they lack the brass-and-parchment fantasy aesthetic, creative animations, and polished interactions found in the rest of the app. This plan brings them on-brand and makes the kiosk feel fun and immersive to interact with.

---

## 1. Floating Action Button (FAB) -- Enchanted Glow

The current FAB is a plain pulsing button. Replace it with a brass-themed, glowing "summon" button that feels magical.

**Changes in `SessionKioskContainer.tsx`:**
- Swap `bg-primary` for a brass gradient background (`bg-gradient-to-br from-brass to-amber-700`)
- Add a breathing brass glow ring using `shadow-[0_0_20px_hsl(var(--brass)/0.5)]` and `animate-pulse-breathe`
- Add a subtle tooltip label "Join Session" floating above the FAB on hover
- On hover, stop the breathing animation and scale up slightly (`hover:scale-110 hover:animate-none`)

## 2. Kiosk Loading State -- Mystical Entrance

The current loading state is a plain spinner. Replace it with a thematic loading experience.

**Changes in `SessionKioskContainer.tsx`:**
- Replace the bare `Loader2` spinner with a centered card containing a Swords icon with `animate-pulse-breathe`, plus "Summoning your character..." text in `font-cinzel`
- Add a faint brass border glow to the loading card

## 3. Kiosk Header -- Fantasy Character Strip

The current header is a plain `bg-card/50` div. Upgrade it to match the campaign view's character strip aesthetic.

**Changes in `SessionKiosk.tsx`:**
- Add a brass gradient bottom border (`border-b-2 border-brass/30`) and parchment-tinted background (`bg-gradient-to-r from-card via-card/90 to-card`)
- Make character name use `font-cinzel text-lg` with a subtle brass text shadow
- Add a small shield icon next to AC value and heart icon next to HP in the subtitle line for quick-glance stats
- Add `animate-fade-in` entrance animation to the header
- The "In Combat" badge becomes a glowing brass pill with `animate-pulse-breathe`
- The "Your Turn!" indicator gets a golden flash animation (a new `flash-gold` keyframe that briefly brightens to full brass, then settles)

## 4. Tab Bar -- Ornate Navigation

The current tab bars are plain `grid grid-cols-5` with no styling. Make them feel like a fantasy toolbar.

**Changes in `SessionKiosk.tsx`:**
- Replace the two stacked `TabsList` grids with a single horizontally scrollable row using `overflow-x-auto flex gap-1` with a subtle scroll fade on edges
- Each `TabsTrigger` gets a tooltip (using the existing Tooltip component) showing the tab name on hover/long-press
- Active tab gets a brass underline indicator (`border-b-2 border-brass`) instead of just text color change
- Add icon labels below each icon on wider screens (`hidden sm:block text-[10px]`)
- Disabled tabs (combat when no encounter, map when no map) show a lock icon overlay

## 5. Tab Content Transitions

The current tab content uses a basic `tab-enter` fade. Enhance it.

**Changes in `src/index.css`:**
- Update `.tab-enter` to use a combined fade + slight slide-up: `animation: fade-in 0.25s ease-out, slide-up-subtle 0.25s ease-out`
- Add new `slide-up-subtle` keyframe: `0% { transform: translateY(6px) } 100% { transform: translateY(0) }`

## 6. Session Ended Overlay -- Dramatic Curtain Call

The current "Session Ended" card is a plain centered card. Make it feel like a dramatic session close.

**Changes in `SessionKiosk.tsx`:**
- Add a dark overlay backdrop (`bg-background/80 backdrop-blur-sm`) that fades in
- The "Session Ended" card gets `animate-scale-in` entrance with brass border accents
- Add a decorative crossed-swords icon above the title
- Add atmospheric text: "The tale pauses here... until next time, adventurer." in `font-cormorant italic`
- Add a "Return to Campaign" button with brass styling

## 7. Sheet and Drawer Polish

The container wrappers need fantasy theming.

**Changes in `SessionKioskContainer.tsx`:**
- Desktop Sheet: Add a left border accent with brass color (`border-l-2 border-brass/30`), parchment-tinted background
- Mobile Drawer: Style the drag handle from plain gray to brass-tinted (`bg-brass/40` instead of `bg-muted`)
- Both containers get a subtle inner shadow at the top for depth

## 8. SessionPlayer Full-Screen Wrapper

The standalone `/session/player` page header is plain. Bring it on-brand.

**Changes in `SessionPlayer.tsx`:**
- Add brass bottom border to the header (`border-b-2 border-brass/20`)
- "Full Session View" label gets `font-cinzel` and a subtle brass color
- The "Exit" button gets ghost styling with a brass hover accent

## 9. New Tailwind Keyframes

**Changes in `tailwind.config.ts`:**
- Add `flash-gold` keyframe: `0% { color: hsl(var(--brass)) } 50% { color: hsl(var(--brass)); text-shadow: 0 0 12px hsl(var(--brass)/0.6) } 100% { color: hsl(var(--warning-amber)) }`
- Add `slide-up-subtle` keyframe: `0% { transform: translateY(6px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 }`
- Add corresponding animation entries

---

## Files Changed

- **`src/components/session/SessionKioskContainer.tsx`** -- FAB glow, loading state, Sheet/Drawer theming, drag handle styling
- **`src/components/session/SessionKiosk.tsx`** -- Header strip, tab bar redesign with tooltips and brass underlines, combat indicators, session ended overlay, tab content icons
- **`src/pages/SessionPlayer.tsx`** -- Header brass accents, font-cinzel, styled exit button
- **`tailwind.config.ts`** -- New `flash-gold` and `slide-up-subtle` keyframes + animations
- **`src/index.css`** -- Updated `.tab-enter` transition with slide-up

### No database changes required

