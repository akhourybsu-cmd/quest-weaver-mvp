

# Campaign Manager -- Micro-Animations and Interaction Polish

## Problem

The campaign manager currently feels static. Cards don't animate in, save actions give a plain text toast with no visual fanfare, and interactions like creating an NPC or finalizing a quest feel no different from editing a spreadsheet. The animation keyframes listed in the design system (fade-in, scale-in, slide-in, etc.) are defined but almost never used -- only one component (`SessionControl`) uses `animate-fade-in`.

## What Changes

### 1. Register Missing Animations in Tailwind Config

The design system defines `fade-in`, `scale-in`, `slide-in-right`, and combined `enter`/`exit` animations, but **none of these are in `tailwind.config.ts`**. Only `accordion-down/up` exist. All the animation keyframes and utility classes need to be added to the config so they actually work as Tailwind classes.

### 2. Staggered Card Entrance Animations

When NPC, Quest, Location, or Faction cards load, they currently pop into existence all at once. Add a staggered fade-up entrance so cards cascade in smoothly:

- Each card gets `animate-fade-in` with an increasing `animation-delay` based on its index (capped at ~10 items so late items don't wait too long)
- Uses the `fade-in` keyframe (translateY(10px) to 0 + opacity 0 to 1)
- Applied to: `NPCCardItem`, `NPCListItem`, `QuestCard`, `LocationCard`, `FactionDirectory` tiles

### 3. Success Save Celebrations

Replace plain `toast.success("NPC saved")` calls with richer feedback:

- **Create a `SuccessToast` CSS animation**: A brief brass-glow pulse on the toast notification for save/create actions
- **Add a subtle scale-bounce on the Save/Create button** when clicked: the button briefly scales down then back (a "press" effect), giving tactile feedback
- Applied to save buttons across: `QuestDialog`, `EnhancedNPCEditor`, `LoreEditor`, and other creator components
- Toast messages get more thematic language: "Quest forged!", "NPC inscribed!", "Lore chronicled!" instead of generic "saved successfully"

### 4. Card Hover Micro-Interactions

Currently cards have `hover:shadow-lg` and `hover:-translate-y-0.5`. Enhance with:

- **Border glow on hover**: Cards get a subtle brass border-glow transition (already partially there with `hover:border-brand-brass/70`, but adding a `box-shadow` glow)
- **Quick-action reveal animation**: The NPC quick-actions already fade in on hover (`opacity-0 group-hover:opacity-100`), but add a slight slide-up so they feel like they emerge rather than just appear

### 5. Dialog Open/Close Transitions

Campaign dialogs (quest creation, NPC editor, lore creators) currently snap open. Add:

- Scale-in entrance: dialog content uses `animate-enter` (combined fade-in + scale-in)
- This leverages the existing `fantasy-border-ornaments` styling and makes the ornate borders feel like they're "materializing"

### 6. Empty State Pulse

The `DMEmptyState` component's icon sits static. Add a gentle breathing/pulse animation to the icon circle, making empty states feel alive and inviting rather than dead-end.

### 7. Progress Bar Animations

Quest progress bars (`Progress` component) currently render at their target width instantly. Add a CSS transition so they animate from 0 to their value, giving a satisfying "filling up" effect.

### 8. Tab Transition Polish

When switching between tabs (Quests, NPCs, Locations, etc.), content currently swaps instantly. Add a quick fade transition on `TabsContent` so content feels like it's transitioning rather than teleporting.

---

## Files Changed

| File | Changes |
|------|---------|
| `tailwind.config.ts` | Add all missing keyframes (fade-in, fade-out, scale-in, scale-out, slide-in-right, slide-out-right) and animation utilities (animate-fade-in, animate-scale-in, animate-enter, animate-exit, etc.) |
| `src/index.css` | Add utility classes: `.stagger-item` for staggered delays, `.btn-press` for button press effect, `.card-glow` for hover glow, `.progress-animate` for progress bar fill animation, `.tab-enter` for tab content fade |
| `src/components/npcs/EnhancedNPCDirectory.tsx` | Add staggered `animate-fade-in` with index-based delay to NPC cards |
| `src/components/campaign/tabs/QuestsTabUpdated.tsx` | Add staggered entrance to quest cards, thematic toast messages |
| `src/components/campaign/tabs/LocationsTab.tsx` | Add staggered entrance to location cards |
| `src/components/factions/FactionDirectory.tsx` | Add staggered entrance to faction tiles |
| `src/components/campaign/DMEmptyState.tsx` | Add pulse animation to the icon container |
| `src/components/quests/QuestDialog.tsx` | Add button press effect on save, thematic toast ("Quest forged!") |
| `src/components/npcs/EnhancedNPCEditor.tsx` | Add button press effect, thematic toast ("NPC inscribed!") |
| `src/components/lore/LoreEditor.tsx` | Add button press effect, thematic toast ("Lore chronicled!") |
| `src/components/ui/dialog.tsx` | Add `animate-enter` class to `DialogContent` for scale-in entrance |
| `src/components/ui/progress.tsx` | Add CSS transition for animated fill |

## Animation Inventory

| Animation | Where Used | Duration |
|-----------|-----------|----------|
| `fade-in` (translateY + opacity) | Card entrances, tab transitions | 300ms |
| `scale-in` (scale 0.95 to 1 + opacity) | Dialog open | 200ms |
| `enter` (fade-in + scale-in combined) | Dialog content | 300ms |
| Button press (scale 0.95 bounce) | Save/Create buttons | 150ms |
| Stagger delay | Card grids (10-50ms per item, capped) | 30ms * index |
| Pulse breathe | Empty state icons | 2s infinite |
| Progress fill | Quest progress bars | 600ms ease-out |
| Border glow | Card hover | 200ms transition |

All animations respect `prefers-reduced-motion` via a media query that disables them for users who prefer reduced motion.

