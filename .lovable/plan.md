

## Read / Edit Mode for Character Narrative Sheet

### What Changes
Transform the narrative sheet from always-editable inputs into a polished **read mode** by default, with an **edit mode** toggle. When saved, it returns to read mode and displays the content beautifully.

### Read Mode (Default)
- Physical description rendered as a compact grid of labeled values (e.g., "**Alignment:** Chaotic Good") using serif font, brass accents
- Personality traits, ideals, bonds, flaws shown as titled paragraphs with fantasy styling — drop-cap first letter on backstory, `font-cinzel` section headers, parchment-toned card backgrounds
- Empty fields show subtle italic placeholder text ("Not yet written...")
- A single **"Edit Narrative"** button (Pen icon) in the header bar

### Edit Mode
- Toggled by the Edit button; swaps display text for the existing inputs/textareas
- Header bar shows **"Save"** and **"Cancel"** buttons
- Cancel reverts to the last saved state and returns to read mode
- Save persists to database, then switches back to read mode

### File to Modify
- `src/components/player/CharacterNarrativeSheet.tsx`
  - Add `editing` boolean state (default `false`)
  - Add `savedData` ref to support cancel/revert
  - Conditionally render read vs edit views for each section
  - On save success, exit edit mode
  - Read mode uses `fantasy-chronicle` and `fantasy-drop-cap` CSS classes from existing `fantasy-lore.css`

