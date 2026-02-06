

# Comprehensive Notes System Audit and Polish

## Audit Findings

After inspecting every file, database table, constraint, trigger, RLS policy, and route, here is what I found:

### Database: Healthy
- `note_links` CHECK constraint correctly includes `NOTE` and `CHARACTER`
- `note_links_unique_link` UNIQUE constraint is in place
- `session_notes` has `version`, `folder`, and `deleted_at` columns
- `trg_check_note_version` trigger is active
- `note_revisions` table exists with proper RLS
- `session_notes` is in the `supabase_realtime` publication
- Visibility CHECK constraint enforces `DM_ONLY`, `SHARED`, `PRIVATE`
- RLS policies are correct for all three tables

### Data State: 15 notes exist, 0 links saved, 0 revisions
The link-saving code looks correct now, but there is a critical bug preventing links from actually being persisted (see Bug 1 below).

---

## Bugs Found

### Bug 1: `note_links` insert silently fails due to UNIQUE constraint + null `link_id`
The UNIQUE constraint is `(note_id, link_type, link_id, label)`. When `link_id` is `NULL` (dangling wikilinks), PostgreSQL treats each `NULL` as distinct, so duplicates are technically allowed there. However, when two entity links of the same type reference the same entity, the delete-then-reinsert pattern should handle it. The real problem is that the code in `performSave` calls `.select("version")` on the update, but the version trigger modifies the `version` field. If the update returns the version correctly, the insert should follow. Let me check the actual flow more carefully -- the 0 links in the database with 15 notes means the save-links block is either erroring silently or being skipped. Looking at the code:

```typescript
// Line 478: Delete all existing links
await supabase.from("note_links").delete().eq("note_id", noteId);
// Line 489: Insert new links  
await supabase.from("note_links").insert(...)
```

These `await` calls don't check for errors. If the insert fails (e.g., a constraint violation), it silently fails. This needs error handling and logging.

### Bug 2: `handleNavigateToNote` doesn't update the parent `note` prop
When navigating via a wikilink or backlink, `handleNavigateToNote` loads the target note's data into local state (title, content, tags, etc.), but the component's `note` prop still points to the original note. This means:
- Saving after navigating saves the OLD note's ID with the NEW note's content (data corruption risk)
- The "Delete" and "History" buttons reference the original note
- Backlinks panel still shows backlinks for the original note

### Bug 3: `@mention` dropdown positioning is broken
The mention and wikilink dropdowns use `position: fixed` with `top: rect.bottom + 5` and `left: rect.left + 10` based on the textarea's bounding rect. This places both dropdowns at the bottom-left of the entire textarea, not near the cursor. For long notes, the dropdown appears far from where the user is typing.

### Bug 4: `as any` type casts throughout NoteEditor
The code uses `(data as any).folder`, `(data as any).version`, `(updatedData as any)?.version` extensively. Since the generated types now include `folder`, `version`, and `deleted_at`, these casts are unnecessary and hide potential type errors.

### Bug 5: `PlayerNotesView` doesn't use `resilientChannel`
`NotesBoard` uses `resilientChannel` for robust reconnection, but `PlayerNotesView` uses raw `supabase.channel()` which can silently disconnect without reconnecting.

### Bug 6: NoteEditor dialog is too cramped at 1339 lines
The editor is a single massive component with all state, logic, and UI crammed in. The dialog has `max-w-3xl max-h-[90vh] overflow-y-auto` which creates a very long vertical scroll. The Outline panel, Backlinks panel, and Version History are all stacked vertically, making the editor feel cluttered.

### Bug 7: Predefined tag matching breaks after normalization
Predefined tags use capitalized names ("NPC", "Quest", "Clue"), but tags are normalized to lowercase on save. When the note reloads, `tags.includes(tagDef.name)` checks `"NPC"` against `["npc"]` and fails -- so predefined tag buttons won't appear selected after reopening.

### Bug 8: QuickCaptureModal uses `nanoid()` for note IDs
The `session_notes` table uses `gen_random_uuid()` as the default for `id`. QuickCaptureModal overrides this with `nanoid()`, which generates a shorter non-UUID string. This could cause issues with foreign key references and UUID validation.

---

## Polish and UX Improvements

### 1. Fix link persistence (silent error handling)
Add `.throwOnError()` or check `error` on the note_links insert call, and add toast feedback if linking fails.

### 2. Fix wikilink/backlink navigation (data corruption risk)
Instead of mutating local state to "navigate" to a different note inside the same dialog, close the editor and reopen it with the target note from the parent's list. This requires a callback like `onNavigateToNote(noteId)` passed from `NotesBoard`, which calls `handleEditNote` with the right note from the notes array.

### 3. Fix tag normalization consistency
Compare tags case-insensitively when rendering predefined tag buttons: `tags.some(t => t.toLowerCase() === tagDef.name.toLowerCase())`.

### 4. Fix QuickCapture ID generation
Remove the `id: noteId` from the insert -- let the database generate its own UUID. Update the link creation to use the returned `data.id`.

### 5. Fix dropdown positioning
For both `@mention` and `[[wikilink]]` dropdowns, compute position relative to the cursor in the textarea using a mirror div or caret coordinates helper, not relative to the textarea element's bounding rect.

### 6. Remove unnecessary `as any` casts
The generated types now include `folder`, `version`, and `deleted_at`. Replace all `(data as any).folder` with proper typed access.

### 7. PlayerNotesView: use `resilientChannel`
Switch from raw `supabase.channel()` to `resilientChannel()` for automatic reconnection.

### 8. NoteEditor layout improvements
- Use a two-panel layout on desktop: left panel for the editor content (toolbar + textarea/preview), right panel for Outline
- Move Backlinks into a collapsible section that's more prominent
- Reduce vertical stacking by using horizontal space better
- Add visual polish: better section separators, grouped action buttons

### 9. NoteCard content preview improvements
- Render wikilinks (`[[Title]]`) as highlighted text in the preview, similar to @mentions
- Strip markdown syntax from preview text for cleaner cards

### 10. Graph view empty state and legend
- Add a color legend showing what node colors mean (folder colors + entity type colors)
- Improve empty state with a brief instructional guide

### 11. PlayerNotesView wikilink rendering
Player notes render raw markdown but don't handle `[[wikilinks]]` -- these show as plain text. Add the same WikilinkText rendering (as read-only styled spans, since players can't edit).

---

## Technical Implementation Details

### File Changes Summary

| File | Changes |
|------|---------|
| `NoteEditor.tsx` | Fix navigation (use callback), fix tag comparison, remove `as any` casts, add error handling on link saves, fix dropdown positioning, layout improvements |
| `NotesBoard.tsx` | Add `onNavigateToNote` handler that finds + opens target note, pass callback to NoteEditor |
| `NoteCard.tsx` | Strip markdown and render `[[wikilinks]]` in preview |
| `QuickCaptureModal.tsx` | Remove manual `id` generation, use returned `data.id` for link creation |
| `WikilinkAutocomplete.tsx` | No changes needed |
| `NoteBacklinks.tsx` | No changes needed |
| `NoteOutline.tsx` | No changes needed |
| `NoteFolderSelector.tsx` | No changes needed |
| `NoteLinkSelector.tsx` | No changes needed |
| `NoteGraph.tsx` | Add color legend |
| `PlayerNotesView.tsx` | Switch to `resilientChannel`, add wikilink rendering in note reader |

### No database changes needed
All schema, constraints, triggers, and RLS policies are correct.

### Implementation Order
1. Fix critical bugs first (link persistence, navigation corruption, tag matching, QuickCapture ID)
2. Remove type casts and fix `PlayerNotesView` channel
3. Improve dropdown positioning
4. Polish NoteEditor layout
5. Polish NoteCard preview, NoteGraph legend, PlayerNotesView wikilinks

