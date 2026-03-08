

# Next Steps: Activate Wave 2 Tools

There are currently 10 active tools and ~20 still marked "coming_soon". The highest-value next batch to activate -- based on DM utility and variety across categories -- would be:

## Tools to Activate (6 tools across 4 categories)

| Tool | Category | Asset Type | Why |
|------|----------|------------|-----|
| **Dungeon Layout Generator** | Maps | `battle_map` | Top-requested DM tool; pairs with existing Battle Map generator |
| **Potion / Poison Generator** | Items | `magic_item` | Lightweight, fun, high session-prep usage |
| **Random Table Generator** | Utilities | `lore` | Extremely versatile; d100 tables are a DM staple |
| **Handout / Letter Generator** | Utilities | `lore` | Unique offering; in-world documents add immersion |
| **Puzzle / Trap Generator** | Utilities | `lore` | Popular for dungeon design, pairs with Dungeon generator |
| **Side Quest Generator** | Story | `quest` | Quick lightweight quests, distinct from the full Quest Generator |

## Implementation

For each tool, add fields and example prompts to `toolRegistry.ts` and flip status to `active`. No backend changes needed -- the edge function already handles all asset types generically via the schema.

### Field Designs

- **Dungeon**: rooms count, theme, hazard level, boss room toggle, environment
- **Potion/Poison**: effect type, rarity, side effects toggle, ingredients theme
- **Random Table**: die type (d4/d6/d8/d10/d12/d20/d100), theme, tone, entry count
- **Handout/Letter**: document type (letter/journal/decree/map note/wanted poster), author, tone, condition
- **Puzzle/Trap**: type (riddle/logic/mechanical/magical), difficulty, reset toggle, lethality
- **Side Quest**: hook type, estimated duration, reward tier, tone

### File Changes

| File | Change |
|------|--------|
| `src/components/beta-tools/toolRegistry.ts` | Add fields, prompts, outputHints, set `status: 'active'` for 6 tools |

Single file change, no migrations, no new components needed.

