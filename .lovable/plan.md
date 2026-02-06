

# Obsidian-Inspired Notes System Overhaul

## Summary

Enhance the existing notes system with Obsidian-style organization features: **wikilink note-to-note linking**, **backlinks panel**, **folder/notebook grouping**, **note graph view**, and **heading outline sidebar**. All existing functionality (session grouping, tags, @mentions, entity links, visibility, pinning, templates, autosave) is preserved unchanged.

---

## Database Changes

### Migration: Add `folder` column to `session_notes`

```sql
ALTER TABLE public.session_notes ADD COLUMN folder TEXT DEFAULT NULL;
CREATE INDEX idx_session_notes_folder ON public.session_notes(campaign_id, folder);
```

No other database changes needed:
- `note_links` already supports arbitrary `link_type` text values, so `NOTE` works immediately
- `idx_note_links_type` index on `(link_type, link_id)` already exists for efficient backlink lookups
- RLS policies on both tables already cover the new use cases

---

## New Files

### 1. `src/components/notes/NoteBacklinks.tsx`
Collapsible panel showing notes that reference the current note.

- Queries `note_links` where `link_type = 'NOTE'` and `link_id = currentNoteId`
- Also does a text search on `session_notes.content_markdown` for `[[Current Note Title]]` as fallback
- Each backlink shows: title, snippet excerpt, clickable to switch to that note
- Renders inside the NoteEditor dialog below Linked Entities

### 2. `src/components/notes/NoteOutline.tsx`
Heading-based table of contents sidebar for the current note.

- Parses markdown content for `#`, `##`, `###` headings in real-time
- Displays indented clickable list
- Clicking a heading scrolls the textarea to that position
- Only shows when the note has 2+ headings (otherwise hidden to reduce clutter)
- On mobile, renders as a collapsible dropdown above the editor instead of a sidebar

### 3. `src/components/notes/WikilinkAutocomplete.tsx`
Autocomplete dropdown triggered by typing `[[` in the note editor.

- When user types `[[`, shows a filtered list of existing note titles in the same campaign
- Queries `session_notes` filtered by campaign_id, matching title against typed text
- On selection, inserts `[[Note Title]]` and closes the dropdown
- Pressing `Escape` or `]]` closes without selecting
- Positioned near the cursor similar to existing @mention dropdown

### 4. `src/components/notes/NoteFolderSelector.tsx`
Combo-box for selecting or creating a notebook/folder.

- Shows existing folder names from campaign notes (deduplicated)
- Allows typing a new folder name (creates on save)
- Suggested defaults displayed as placeholder text: "Session Prep", "World Notes", "Plot Threads"
- Uses the existing Popover + Command pattern from NoteLinkSelector

### 5. `src/components/notes/NoteGraph.tsx`
Force-directed graph view of note connections, reusing the pattern from `LoreGraph.tsx`.

- Nodes = notes in the campaign (colored by folder, or by visibility if no folder)
- Edges = note_links with `link_type = 'NOTE'` (note-to-note links) + entity links
- Uses `react-force-graph-2d` (already installed)
- Clicking a node opens that note in the editor
- Responsive sizing using container ref (same as LoreGraph)

---

## Modified Files

### `src/components/notes/NoteEditor.tsx`
Changes (all additive, existing code untouched):

1. **Add `folder` state** alongside existing state variables (title, content, visibility, etc.)
2. **Load/save folder** in existing `loadNoteSession` and `performSave` functions (just add `folder` to select/update/insert)
3. **Add NoteFolderSelector** in the form, between the Session selector and the Pin/Autosave toggles
4. **Add `[[` wikilink detection** in `handleContentChange`, similar to existing `@` mention detection:
   - Detect `[[` pattern, show WikilinkAutocomplete dropdown
   - On select, insert `[[Note Title]]` into content
5. **Parse wikilinks on save** in `performSave`:
   - Extract all `[[Note Title]]` matches from content
   - Resolve titles to note IDs via a query to `session_notes`
   - Create `note_links` entries with `link_type = 'NOTE'`
   - Existing entity links are preserved (the delete-and-reinsert pattern already handles this)
6. **Render `[[wikilinks]]` in preview** tab:
   - Custom ReactMarkdown component to render `[[Note Title]]` as styled clickable spans
7. **Add NoteBacklinks panel** below Linked Entities section
8. **Add NoteOutline panel** as a collapsible section in the editor (between toolbar and textarea, or as a right-side panel on desktop)

### `src/components/notes/NotesBoard.tsx`
Changes (all additive):

1. **Add `folder` to Note interface** and to the `loadNotes` query (`.select("*")` already fetches it)
2. **Add `groupMode` state**: `'session' | 'notebook' | 'flat'` (default: `'session'` to preserve current behavior)
3. **Add group-by toggle** in the header area, next to the session filter dropdown
4. **Add notebook grouping logic** alongside existing session grouping:
   - When `groupMode === 'notebook'`: group by `note.folder` (or "Unfiled")
   - When `groupMode === 'flat'`: no grouping, just a flat list
   - When `groupMode === 'session'`: existing behavior (unchanged)
5. **Add "Graph" toggle button** in the header to switch between list view and graph view
6. **Render NoteGraph** when graph view is active

### `src/components/notes/NoteCard.tsx`
Minimal change:

1. **Add `folder` to the Note interface** (optional field)
2. **Show folder badge** on the card (if present), next to session pill

### `src/components/notes/QuickCaptureModal.tsx`
Minimal change:

1. **Add optional NoteFolderSelector** between the Content textarea and Auto Tags section
2. **Include folder in the insert** call when saving

---

## Wikilink Resolution Logic (in NoteEditor save)

```
On save:
1. Parse content for all [[...]] matches
2. Collect unique titles
3. Query session_notes where campaign_id = X and title IN (titles)
4. For matched titles, create note_links with link_type='NOTE', link_id=matched_note_id
5. For unmatched titles, create note_links with link_type='NOTE', link_id=null, label=title
   (these are "dangling" links -- the note doesn't exist yet, but the reference is preserved)
6. Merge with existing entity links (NPC, LOCATION, QUEST, CHARACTER types)
7. Delete old links + insert all new links (existing pattern)
```

---

## What Is NOT Changed

- All existing session-based grouping logic in NotesBoard
- All existing @mention autocomplete in NoteEditor
- All existing NoteLinkSelector entity linking
- All existing tag system (predefined + custom)
- All existing visibility (DM_ONLY/SHARED/PRIVATE) logic
- All existing pin/autosave functionality
- All existing templates
- All existing RLS policies
- All existing routes (`/notes`, campaign tabs)
- PlayerNotesView component
- QuickCaptureModal keyboard shortcut (Cmd+J)
- AddItemToSessionDialog integration
- Realtime subscriptions

---

## Technical Details

### Outline Parser
```typescript
function parseOutline(markdown: string): { level: number; text: string; offset: number }[] {
  const headings = [];
  const lines = markdown.split('\n');
  let offset = 0;
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({ level: match[1].length, text: match[2], offset });
    }
    offset += line.length + 1;
  }
  return headings;
}
```

### Wikilink Parser
```typescript
function parseWikilinks(markdown: string): string[] {
  const titles: string[] = [];
  const matches = markdown.matchAll(/\[\[([^\]]+)\]\]/g);
  for (const match of matches) {
    if (!titles.includes(match[1])) titles.push(match[1]);
  }
  return titles;
}
```

### Group-by Notebook Logic
```typescript
const notesByFolder = notes.reduce((acc, note) => {
  const folder = note.folder || 'Unfiled';
  if (!acc[folder]) acc[folder] = [];
  acc[folder].push(note);
  return acc;
}, {} as Record<string, Note[]>);
```

---

## Mobile Responsiveness

- **Outline panel**: Collapses into a dropdown/collapsible above the textarea on mobile (not a sidebar)
- **Graph view**: Full-width, responsive via container ref
- **Folder selector**: Standard mobile-friendly popover/command pattern
- **Wikilink autocomplete**: Same positioning strategy as existing @mention dropdown
- **Group-by toggle**: Small segmented control that wraps on mobile
- **Backlinks panel**: Collapsible accordion at the bottom of the editor

---

## Implementation Order

1. Database migration (add `folder` column)
2. Create `NoteFolderSelector.tsx`
3. Create `WikilinkAutocomplete.tsx`
4. Create `NoteOutline.tsx`
5. Create `NoteBacklinks.tsx`
6. Create `NoteGraph.tsx`
7. Update `NoteEditor.tsx` (folder, wikilinks, outline, backlinks)
8. Update `NotesBoard.tsx` (group-by toggle, graph view)
9. Update `NoteCard.tsx` (folder badge)
10. Update `QuickCaptureModal.tsx` (folder selector)

