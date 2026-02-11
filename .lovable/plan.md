

# Player Hub Combat Screen Polish

## Overview
Bring the combat screen components (`PlayerCombatView`, `PlayerCombatActions`, `PlayerEffects`, `PlayerInitiativeDisplay`) up to the same fantasy aesthetic and responsive standards as the `PlayerCharacterSheet` and rest of the Player Hub.

## Current Issues

1. **No fantasy theming** -- Combat components use plain `Card` with no `fantasy-border-ornaments`, no brass accents, no parchment overlays, no `font-cinzel` headers. This clashes with the richly-themed character sheet.
2. **No animations** -- Initiative entries, combat log messages, and condition cards appear without entrance animations (no `animate-fade-in`, no staggered reveals).
3. **"Unknown" fallback text** -- If a character or monster lookup fails, users see bare "Unknown" text with no visual differentiation or icon.
4. **Mobile text truncation** -- Combatant names in initiative rows lack `truncate`/`min-w-0` in `PlayerCombatView` (present in `PlayerInitiativeDisplay` but inconsistent).
5. **Plain action economy chips** -- The `ActionChip` in `PlayerCombatActions` is functional but lacks the brass accent styling and hover feedback used elsewhere.
6. **"Your Turn" banner is understated** -- The `CardTitle "Your Turn"` is a plain text header; it should pulse/glow to match the urgency of combat.
7. **HP bar missing in initiative** -- `PlayerCombatView` shows HP as plain text; the character sheet uses colored gradient bars.
8. **Combat log lacks visual richness** -- Log entries are plain text with no icons for action types (damage, healing, save, etc.).
9. **Conditions tab inline description** -- Good mobile handling exists, but no entrance animations or brass-themed styling.
10. **`PlayerEffects` card** -- Plain card styling, no fantasy border or thematic decoration.

## Plan

### 1. Fantasy Theming Pass (all 4 combat components)
- Add `fantasy-border-ornaments` class and parchment overlay to main `Card` wrappers in `PlayerCombatView`, `PlayerCombatActions`, `PlayerEffects`, and `PlayerInitiativeDisplay`.
- Switch all card titles to `font-cinzel` with `text-brass` or themed color and `tracking-wide`.
- Add brass gradient dividers between sections (the `h-px bg-gradient-to-r from-transparent via-brass/50 to-transparent` pattern from the character sheet).

### 2. Initiative List Animations and HP Bars
- Add staggered `animate-fade-in` with incremental `animation-delay` to each initiative entry.
- Replace plain HP text (`{hp_current}/{hp_max}`) with a mini colored HP bar matching the `getHPColor` pattern used in `MonsterRoster`.
- Add `hover:border-brass/50 transition-colors` to initiative entry cards.
- Ensure `truncate` and `min-w-0` on combatant names in `PlayerCombatView` (already done in `PlayerInitiativeDisplay`).

### 3. "Your Turn" Glow Banner
- In `PlayerCombatActions`, add a pulsing brass border-glow (`shadow-[0_0_12px_hsl(var(--brass)/0.4)]`) and `animate-[pulse_2s_ease-in-out_infinite]` to the wrapping card when `isMyTurn` is true.
- Add a `Swords` icon to the "Your Turn" title with `font-cinzel`.

### 4. Action Economy Chips Upgrade
- Restyle `ActionChip` with brass border accents: available actions get `border-brass/50 bg-brass/10`, used actions get a muted crossed-out style.
- Add press-down scale feedback (`active:scale-95`).

### 5. Combat Log Visual Enhancement
- Add small icons per `action_type`: crossed swords for damage, heart for healing, shield for save, sparkles for effect.
- Style round markers as brass-accented badges instead of plain `[Round X]` text.
- Add `animate-fade-in` to new log entries.

### 6. Conditions and Effects Fantasy Styling
- In `PlayerCombatView` conditions tab, add staggered entrance animations.
- In `PlayerEffects`, add `fantasy-border-ornaments` to the card, `font-cinzel` to the title, brass accents to the concentration banner border.

### 7. "Unknown" Display Fix
- Replace bare "Unknown" fallback text in both `PlayerCombatView` and `PlayerInitiativeDisplay` with a styled placeholder: italic text, muted color, and a `HelpCircle` icon to indicate missing data rather than showing a cryptic label.

### 8. Mobile Responsiveness Check
- Ensure all combat buttons meet 44px minimum touch targets.
- Verify `flex-wrap` on combat option buttons doesn't clip on narrow screens.
- Confirm ScrollArea heights use responsive `h-[300px] sm:h-[400px]` (already in place, will verify no regressions).

---

### Technical Details

**Files to modify:**
- `src/components/player/PlayerCombatView.tsx` -- Fantasy card wrapper, initiative HP bars, log icons, animations, "Unknown" fix, name truncation
- `src/components/player/PlayerCombatActions.tsx` -- "Your Turn" glow, ActionChip restyle, font-cinzel headers, combat option button sizing
- `src/components/player/PlayerEffects.tsx` -- Fantasy card wrapper, font-cinzel title, brass accents
- `src/components/player/PlayerInitiativeDisplay.tsx` -- Fantasy card wrapper, HP bar addition, animations, "Unknown" fix
- `src/pages/SessionPlayer.tsx` -- No structural changes needed; combat tab content is already delegated to components

**No new files or dependencies required.** All styling uses existing Tailwind utilities, animation classes, and fantasy-border CSS classes already in the project.

