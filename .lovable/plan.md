
# Consolidate Character Header and Multi-Column Desktop Layout

## Problem
1. **Duplicate identity**: The page header shows portrait + "Level 4 Monk", then the character sheet card repeats the same portrait, name, and class info again. Two avatars, two instances of the class/level.
2. **Single narrow column**: All character data (HP, stats, abilities, skills, spells, features) is stacked vertically in one column, requiring heavy scrolling on desktop.

## Solution

### 1. Unified Regal Hero Header (PlayerCharacterViewPage)

Remove the separate page header (portrait + level/class) and the duplicate header inside `PlayerCharacterSheet`. Replace them with a single, prominent "hero banner" at the top of the page that feels proud and regal:

- Large portrait (96x96px on desktop) with brass double-border frame and a subtle glow
- Character name in large `font-cinzel` text with the Level Up button inline
- Level, class, ancestry, and subclass as styled badges below the name
- Back button moved to a minimal top-left position
- The whole banner gets a gradient background with brass accents

### 2. Multi-Column Desktop Layout (PlayerCharacterSheet)

Restructure the sheet internals to use a responsive column layout:

**Desktop (lg and above) -- 3 columns:**
- **Left column**: HP section, Death Saves, Core Stats (AC/Speed/Prof/Perception), Exhaustion, Warlock Pact Slots, Resources
- **Middle column**: Ability Scores, Saving Throws, Skills, Proficiencies, Languages
- **Right column**: Spellcasting stats, Spell Slots, Spellbook, Features & Abilities

**Mobile**: Remains single-column stacked (unchanged behavior).

The outer `Card` wrapper and `ScrollArea` with `h-[calc(100vh-280px)]` are removed. Instead, the page itself manages the viewport height, and the three columns each get their own scroll areas so content doesn't overflow the screen.

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/PlayerCharacterViewPage.tsx` | Replace the small header with a regal hero banner; pass character data props to sheet; remove portrait editor from header (move into the hero banner) |
| `src/components/player/PlayerCharacterSheet.tsx` | Remove the internal "Character Header" block (lines 389-432); restructure the content area from single-column into a 3-column responsive grid; remove the outer Card/ScrollArea wrapper; accept optional character data props to avoid re-fetching |

### Detailed Changes

**PlayerCharacterViewPage.tsx:**
- Remove current lines 82-102 (the small portrait + level/class block)
- Add a hero banner section with:
  - `CharacterPortraitEditor` in a large brass-framed container
  - Character name in `text-3xl font-cinzel font-bold`
  - Level, class, ancestry as badges
  - Subclass badge (or "Subclass Available!" pulse)
  - Level Up button with brass styling
- Container uses `h-[calc(100vh-8rem)]` with `overflow-hidden` so the sheet below fills remaining space
- Pass `character` object to `PlayerCharacterSheet` to avoid double-fetching

**PlayerCharacterSheet.tsx:**
- Remove the `Card` > header block (lines 384-432) -- no more duplicate portrait/name
- Remove the outer `Card` and single `ScrollArea` wrapper
- Reorganize content into `grid grid-cols-1 lg:grid-cols-3 gap-6`
- Each column gets its own `ScrollArea` with `h-[calc(100vh-16rem)]` so they scroll independently on desktop
- Left column: HP, Death Saves, Core Stats grid, Exhaustion, Warlock Slots, Resources
- Middle column: Abilities, Saving Throws, Skills, Proficiencies, Languages
- Right column: Spellcasting, Spell Slots, Spellbook, Features
- On mobile, all sections stack naturally in a single scrollable flow
- Dialogs (spell detail, feature detail, trait detail, level-up wizard) remain unchanged at the bottom
