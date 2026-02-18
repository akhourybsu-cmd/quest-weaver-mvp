
# Condensed Header for Player Campaign View

## What's Causing the Dead Space

The top of `PlayerCampaignView.tsx` stacks three separate vertical blocks:

1. `Back to Dashboard` button (`mb-4`)
2. Campaign title + status badge row (`mb-6`)
3. A full `<Card>` for the character (with `CardHeader`, `CardContent`, and internal padding)

Combined with `p-4 md:p-8` outer padding, this pushes the tabs well down the screen before any actual content is visible.

## Solution: Compact Header Strip

Merge all of the above into a single compact header band, similar to the Campaign Manager's "Creative Mode" header. The new layout has two rows:

**Row 1 (top bar):** `← Back` | Campaign Name | Status Badge | `Join Session` button — all on one line with tight padding.

**Row 2 (character strip):** Small avatar + character name + class/level inline — displayed as a slim row, not a card, with a subtle border-bottom divider instead of a full raised card.

If no character is assigned, replace the full empty-state card with a single inline prompt: a small ghost button `+ Assign Character` right next to the campaign title.

## Visual Before / After

```text
BEFORE (3 stacked blocks + outer padding)
┌────────────────────────────────────────────┐
│  p-8                                       │
│  [← Back to Dashboard]           mb-4      │
│                                            │
│  Campaign Name (3xl/4xl)        mb-6       │
│  Campaign Code: XXXXXX                     │
│                             [Badge][Join]  │
│                                            │
│  ┌─ Card ─────────────────────────────┐    │
│  │ CardHeader: "Your Character"       │    │
│  │ CardContent:                       │    │
│  │  [Avatar] Name / Lv1 Fighter       │    │
│  └────────────────────────────────────┘    │
│                                   mb-6     │
│  [Tabs]                                    │
└────────────────────────────────────────────┘

AFTER (single compact header strip)
┌────────────────────────────────────────────┐
│  p-4 (tighter)                             │
│  [←] Campaign Name (2xl)  [Badge] [Join]  │
│  [Avatar] Lv1 Fighter · Subclass    [Chg]  │
│  ──────────────────────────────────────── │
│  [Tabs]                                    │
└────────────────────────────────────────────┘
```

## Specific Changes to `PlayerCampaignView.tsx`

1. **Reduce outer padding**: `p-4 md:p-8` → `p-3 md:p-4` (or `px-4 pt-3 pb-0`)
2. **Remove the standalone Back button block**: Move the back arrow into the first row as a small icon-only ghost button
3. **Merge title + status into one `flex` row**: `← [Campaign Name] [Code chip] [Status Badge] [Join Session]`
4. **Replace the Character Card** with a slim inline strip:
   - Avatar (w-8 h-8), character name, level + class, subclass in muted text
   - `Change Character` becomes a small ghost/outline button on the right
   - Separated from tabs by a simple `border-b border-brass/20` divider rather than a card shadow
5. **No-character state**: Compact single-line prompt `You haven't selected a character · [+ Select]` instead of the centered empty state with icon
6. **Remove `mb-6` gaps** between sections — use `gap-1` / `gap-2` inside the flex column header instead

## Files Modified

- `src/pages/PlayerCampaignView.tsx` — header restructure only; all data fetching logic unchanged
