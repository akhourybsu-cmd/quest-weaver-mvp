
# Quest Creation Dialog -- Design Overhaul and Functionality Audit

## Current State Summary

The quest creation dialog is a tabbed modal (Basics, Objectives, Rewards, Advanced) at `max-w-4xl` with a `h-[500px]` ScrollArea. It functions but has several UX and design issues.

### Design Problems Identified

1. **No Fantasy Styling**: The dialog uses the plain `default` variant instead of the `ornaments` fantasy border used by QuestDetailDialog and other campaign dialogs. It looks inconsistent with the rest of the app.

2. **Generic Tab Layout**: All 4 tabs are always visible even when "Objectives" and "Rewards" are effectively optional/secondary. A DM creating a quick quest must mentally skip past them.

3. **Cluttered Basics Tab**: The Basics tab crams 7+ fields together (Title, Type, Status, Description, Quest Giver, Difficulty, Primary Location, Additional Locations, Tags). It's overwhelming on first open. The most essential fields (Title, Description) aren't visually prioritized.

4. **Redundant Location Fields**: There's both a "Primary Location" (linked to location entity) AND a free-text "Locations" tag list. This is confusing -- a DM doesn't know which to use. The free-text one adds arbitrary strings that aren't linked to actual location entities.

5. **Fixed 500px ScrollArea**: The `h-[500px]` height is rigid and doesn't adapt to viewport. On smaller screens it clips; on larger screens it wastes space.

6. **Footer Crowding**: The footer packs Delete, "Visible to Players" toggle, "Add to Session", Cancel, and Create/Update buttons all in one row. On smaller screens this wraps awkwardly.

7. **Rewards Tab is Sparse**: It only has XP and GP fields, then a placeholder text about item rewards. Two-thirds of the tab is empty space.

8. **No Visual Hierarchy in Objectives**: Objective cards are plain bordered boxes. No numbered ordering, no drag handles (step order matters), no visual distinction between types.

### Functionality Gaps

Comparing the dialog form fields to the database schema (`quests` table), here's what exists in the DB but isn't exposed in the form:

| DB Column | In Dialog? | Notes |
|-----------|-----------|-------|
| `title` | Yes | |
| `description` | Yes | |
| `quest_type` | Yes | |
| `status` | Yes (edit only) | |
| `difficulty` | Yes | |
| `quest_giver_id` | Yes | |
| `legacy_quest_giver` | Yes | Fallback free-text |
| `location_id` | Yes | |
| `locations` | Yes | Free-text tags (redundant) |
| `tags` | Yes | |
| `reward_xp` | Yes | |
| `reward_gp` | Yes | |
| `reward_items` | **No** | JSON column exists but never written to |
| `assigned_to` | Yes | Character checkboxes |
| `faction_id` | Yes | |
| `dm_notes` | Yes | |
| `player_visible` | Yes | |
| `lore_page_id` | Yes | |
| `quest_chain_parent` | **No** | FK to parent quest -- never used |
| `session_notes` | **No** | Session-specific notes -- never used |
| `is_completed` | **No** | Boolean on quest itself (separate from status) |

For `quest_steps`, these DB columns aren't used in the form:
- `location` / `location_id` -- step-level location
- `npc_id` -- step-level NPC
- `encounter_id` -- link step to an encounter
- `notes` -- per-step notes
- `parent_step_id` -- sub-steps

### Other Issues Found

- **Difficulty mismatch**: Dialog offers "moderate" but `QuestsTab` card expects "medium" for coloring. The `getDifficultyColor` function uses "medium" but the Select has "Moderate".
- **Form state not using react-hook-form**: The dialog uses 20+ individual `useState` calls instead of `useForm`. This makes validation scattered and reset logic duplicated in 3 places.
- **No loading state on save**: The Create/Update button has no spinner or disabled state while the DB operation runs, allowing double-clicks.

---

## Implementation Plan

### Phase 1: Visual Redesign of the Dialog

**Apply Fantasy Styling**
- Add `variant="ornaments"` and `size="xl"` to the DialogContent
- Apply `font-cinzel` to the DialogTitle
- Add brass-themed accents to tab triggers

**Reorganize into a Smarter Layout**
- Restructure from 4 equal tabs into 2 views: a streamlined **Main Form** and an expandable **Details** section
- Main form (always visible): Title, Quest Type, Difficulty, Description, Quest Giver, Primary Location
- Collapsible/tabbed details section: Objectives, Rewards and Assignments, DM Notes and Links
- This lets a DM create a quick quest by filling just the essentials without navigating tabs

**Fix Heights**
- Replace `h-[500px]` with `h-[60vh] max-h-[500px]` for responsive behavior

**Fix Footer Layout**
- Move the "Visible to Players" toggle into the Advanced/Details section
- Keep only Cancel and Create/Update in the footer, with Delete in a dropdown or at the top
- Add a loading/saving spinner to the submit button

### Phase 2: Clean Up Form Fields

**Remove Redundant Free-Text Locations**
- Remove the "Locations" free-text tag field (the arbitrary strings aren't linked to real location entities)
- Keep only the "Primary Location" select which links to actual campaign locations
- If multiple locations are needed, convert to a multi-select of actual location entities

**Fix Difficulty Values**
- Change "Moderate" to "Medium" in the Select to match what the card display expects, OR update the card display to handle "moderate". Will standardize to "medium" throughout.

**Wire Up Missing DB Fields**
- **Quest Chain Parent**: Add an optional "Parent Quest" select to the details section, showing other quests in the campaign. This enables quest chains (a highly requested D&D feature).
- **Reward Items**: Add item reward selection from the campaign's Item Vault, replacing the placeholder text with a functional item picker.

### Phase 3: Objectives UX Improvements

**Visual Polish**
- Add numbered step indicators (Step 1, Step 2, etc.)
- Add subtle type-colored left borders on each objective card (e.g., red for combat, green for exploration)
- Show the objective type as a small badge rather than a full-width select

**Simplify Step Creation**
- Default to just a description field with a "simple checkbox" type
- Only show the Type and Progress Goal fields when the DM clicks an "Advanced" toggle on the step
- This makes adding quick objectives a single-field operation

### Phase 4: Rewards Section Enhancement

**Consolidate Rewards and Assignments**
- Merge the "Rewards" and "Advanced" tabs into a single "Rewards and Details" section
- Group XP/GP fields side by side (already done)
- Add the item reward picker below the currency rewards
- Move Character Assignment and Faction Association here since they're quest-level metadata

### Phase 5: Form Architecture

**Add Submit Loading State**
- Disable the submit button and show a Loader2 spinner while saving
- Prevent double-submission

**Centralize Form Reset**
- Extract the 3 duplicated reset blocks into a single `resetForm()` function

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/quests/QuestDialog.tsx` | Complete redesign: fantasy styling, reorganized layout, fix difficulty values, add quest chain parent, fix reward items, add loading state, centralize reset, remove redundant locations field |
| `src/components/campaign/tabs/QuestsTabUpdated.tsx` | Update `getDifficultyColor` to handle both "medium" and "moderate" for backward compatibility |

## Design Preview

The redesigned dialog will follow this structure:

```text
+--------------------------------------------------+
|  [ornate brass border]                            |
|                                                   |
|  Create Quest                    font-cinzel      |
|  Create a new quest for your campaign             |
|                                                   |
|  +----------------------------------------------+ |
|  | Title *              | Type    | Difficulty  | |
|  | [The Missing Heir..] | [Side ] | [Medium   ] | |
|  +----------------------------------------------+ |
|  | Description                                  | |
|  | [Markdown editor with toolbar]               | |
|  +----------------------------------------------+ |
|  | Quest Giver         | Primary Location       | |
|  | [Select NPC...]     | [Select location...]   | |
|  +----------------------------------------------+ |
|                                                   |
|  [Objectives] [Rewards & Details] [DM Notes]      |
|  +----------------------------------------------+ |
|  | (Tab content - objectives / rewards / notes)  | |
|  +----------------------------------------------+ |
|                                                   |
|  [Delete]           [Cancel]  [Create Quest]      |
|  [ornate brass border]                            |
+--------------------------------------------------+
```

This keeps the essential fields always visible at the top and tucks secondary details into lightweight tabs below, reducing the number of clicks needed for a basic quest from 1 tab navigation + scroll to zero.
