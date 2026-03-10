

## Card Flip: Mechanical Front / Narrative Back

### Problem
The character sheet only shows mechanical data (HP, AC, abilities, spells, features). The narrative fields — personality traits, ideals, bonds, flaws, backstory, alignment, physical description — are stored in the database (`personality_traits`, `ideals`, `bonds`, `flaws`, `notes`, `alignment`, `age`, `height`, `weight`, `eyes`, `skin`, `hair`) but never displayed or editable on this page.

### Solution
Add a CSS 3D card-flip to `PlayerCharacterViewPage.tsx`. A toggle button in the hero banner flips the entire sheet area with a smooth perspective animation. The front side is the existing `PlayerCharacterSheet`. The back side is a new `CharacterNarrativeSheet` component showing all narrative fields in an editable, save-able layout.

### Layout

```text
┌─────────────────────────────────────────┐
│  Hero Banner  [← Back]  [⟳ Flip Card]  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─── FRONT (default) ───────────────┐  │
│  │  PlayerCharacterSheet (existing)  │  │
│  │  HP / AC / Abilities / Spells ... │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─── BACK (flipped) ────────────────┐  │
│  │  CharacterNarrativeSheet (new)    │  │
│  │  ┌──────────┐ ┌────────────────┐  │  │
│  │  │ Physical │ │ Personality    │  │  │
│  │  │ Desc     │ │ Traits         │  │  │
│  │  │ align/   │ │ Ideals         │  │  │
│  │  │ age/ht/  │ │ Bonds          │  │  │
│  │  │ wt/eyes/ │ │ Flaws          │  │  │
│  │  │ skin/hair│ │                │  │  │
│  │  └──────────┘ └────────────────┘  │  │
│  │  ┌──────────────────────────────┐ │  │
│  │  │ Backstory / Notes            │ │  │
│  │  │ (large textarea)             │ │  │
│  │  └──────────────────────────────┘ │  │
│  │  [Save Changes]                   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Technical Details

**A. CSS 3D Flip Animation** — Add to `PlayerCharacterViewPage.tsx`:
- A `perspective` container wrapping a `transform-style: preserve-3d` inner div
- `isFlipped` state toggles `rotateY(180deg)` with a 0.6s transition
- Front face: `backface-visibility: hidden`; Back face: `backface-visibility: hidden; rotateY(180deg)`
- A flip button (RotateCcw icon) in the hero banner toggles the state

**B. New `CharacterNarrativeSheet` component** — `src/components/player/CharacterNarrativeSheet.tsx`:
- Fetches `personality_traits`, `ideals`, `bonds`, `flaws`, `notes`, `alignment`, `age`, `height`, `weight`, `eyes`, `skin`, `hair` from the `characters` table
- Displays in two columns: physical description (left), personality/narrative (right)
- All fields are editable inline (inputs for physical, textareas for narrative)
- Save button persists changes to the database
- Styled with the same fantasy theme (brass borders, font-cinzel headers)

**C. Modify `PlayerCharacterViewPage.tsx`**:
- Add flip button to the hero banner
- Wrap `PlayerCharacterSheet` and `CharacterNarrativeSheet` in the 3D flip container
- Pass `characterId` to both components

### Files to create
- `src/components/player/CharacterNarrativeSheet.tsx`

### Files to modify
- `src/pages/PlayerCharacterViewPage.tsx`

