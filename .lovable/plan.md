
# Obsidian Notes System: Critical Fixes and Structural Hardening

## Critical Bugs Found During Audit

### Bug 1: Wikilinks Are Silently Broken
The `note_links` table has a CHECK constraint that only allows: `NPC`, `LOCATION`, `QUEST`, `ITEM`, `FACTION`, `ENCOUNTER`. It does **not** include `NOTE` or `CHARACTER`. Every attempt to save a `[[wikilink]]` (which uses `link_type = 'NOTE'`) or an @mention of a character (which uses `link_type = 'CHARACTER'`) is silently failing. The `note_links` table currently has **zero rows** -- nothing has been able to save.

### Bug 2: Player Notes View Shows Nothing
`PlayerNotesView.tsx` queries for `visibility = 'players'`, but the actual visibility values in the database are `DM_ONLY`, `SHARED`, and `PRIVATE` (enforced by a CHECK constraint). The realtime subscription also filters on `visibility=eq.players`. This means the player notes view is permanently empty.

---

## Implementation Plan

### Phase 1: Fix Critical Bugs

**1a. Fix `note_links` CHECK constraint**

SQL migration to drop the old constraint and replace it with one that includes `NOTE` and `CHARACTER`:

```sql
ALTER TABLE public.note_links DROP CONSTRAINT note_links_link_type_check;
ALTER TABLE public.note_links ADD CONSTRAINT note_links_link_type_check 
  CHECK (link_type = ANY (ARRAY['NPC','LOCATION','QUEST','ITEM','FACTION','ENCOUNTER','NOTE','CHARACTER']));
```

**1b. Fix `PlayerNotesView.tsx`**

- Change `.eq('visibility', 'players')` to `.eq('visibility', 'SHARED')` in the query
- Change the realtime filter from `visibility=eq.players` to `visibility=eq.SHARED`

---

### Phase 2: Concurrency Protection (Prevent Last-Write-Wins)

**2a. Add `version` column to `session_notes`**

```sql
ALTER TABLE public.session_notes ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
```

**2b. Add a validation trigger** that increments `version` on every update and rejects stale writes:

```sql
CREATE OR REPLACE FUNCTION check_note_version()
RETURNS trigger AS $$
BEGIN
  IF OLD.version != NEW.version THEN
    RAISE EXCEPTION 'Conflict: note was modified by another user (expected version %, got %)', OLD.version, NEW.version;
  END IF;
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_note_version
  BEFORE UPDATE ON public.session_notes
  FOR EACH ROW EXECUTE FUNCTION check_note_version();
```

**2c. Update `NoteEditor.tsx`**

- Track `version` in state alongside other note fields
- On save, include `version` in the update payload (sends the version we loaded)
- The trigger will reject if someone else saved in between
- On conflict (error containing "Conflict: note was modified"), show a toast: "This note was modified by someone else. Please refresh and try again."
- After successful save, update local `version` state to the new value

---

### Phase 3: Revision History

**3a. Create `note_revisions` table**

```sql
CREATE TABLE public.note_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.session_notes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT,
  folder TEXT,
  saved_by UUID NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_note_revisions_note ON public.note_revisions(note_id, version DESC);

-- RLS
ALTER TABLE public.note_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view revisions"
  ON public.note_revisions FOR SELECT
  USING (note_id IN (
    SELECT id FROM session_notes WHERE campaign_id IN (
      SELECT c.id FROM campaigns c WHERE c.dm_user_id = auth.uid()
      UNION
      SELECT cm.campaign_id FROM campaign_members cm WHERE cm.user_id = auth.uid()
    )
  ));

CREATE POLICY "Authors and DMs can create revisions"
  ON public.note_revisions FOR INSERT
  WITH CHECK (saved_by = auth.uid());
```

**3b. Create revision on save in `NoteEditor.tsx`**

After a successful save (manual or autosave), insert a revision row with the current state. For autosave, only create a revision every 5th autosave (or every 60 seconds) to avoid flooding the table.

**3c. Add "Version History" button in `NoteEditor.tsx`**

- Shows a scrollable list of revisions (title, saved_at, saved_by)
- Clicking a revision shows the content in a read-only preview
- "Restore this version" button that loads revision data into the editor fields

---

### Phase 4: Soft Delete

**4a. Add `deleted_at` column to `session_notes`**

```sql
ALTER TABLE public.session_notes ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX idx_session_notes_deleted ON public.session_notes(deleted_at) WHERE deleted_at IS NOT NULL;
```

**4b. Update all queries to exclude soft-deleted notes**

- `NotesBoard.tsx` `loadNotes`: add `.is('deleted_at', null)`
- `NoteGraph.tsx` `loadGraphData`: add `.is('deleted_at', null)`
- `PlayerNotesView.tsx` `loadSharedNotes`: add `.is('deleted_at', null)`
- `WikilinkAutocomplete.tsx`: add `.is('deleted_at', null)`
- `NoteBacklinks.tsx`: add `.is('deleted_at', null)`
- `NoteFolderSelector.tsx`: add `.is('deleted_at', null)`
- `QuickCaptureModal.tsx`: no change needed (insert only)

**4c. Change delete to soft delete in `NoteEditor.tsx`**

Instead of `.delete().eq("id", note.id)`, update to `.update({ deleted_at: new Date().toISOString() }).eq("id", note.id)`.

Update the delete confirmation text to say "This note will be moved to trash."

**4d. Add "Trash" view in `NotesBoard.tsx`** (optional, can be done later)

A new tab showing soft-deleted notes with "Restore" and "Permanently Delete" actions.

---

### Phase 5: Link Integrity -- Uniqueness Constraint and Transaction Safety

**5a. Add uniqueness constraint on `note_links`**

```sql
ALTER TABLE public.note_links 
  ADD CONSTRAINT note_links_unique_link UNIQUE (note_id, link_type, link_id, label);
```

This prevents duplicate links from being created during concurrent saves or race conditions.

**5b. Wrap save in a transactional pattern**

In `NoteEditor.tsx` `performSave`, use Supabase's `.rpc()` or sequential awaits with error handling. Since Supabase JS doesn't have native transactions, the approach is:
- Delete old links first
- Insert new links with `ON CONFLICT DO NOTHING` (via the uniqueness constraint)
- If any step fails, show error but don't lose the user's content

---

### Phase 6: Tags GIN Index (Already Done!) and Normalization

The GIN index on `tags` already exists (`idx_session_notes_tags`). What's missing is normalization.

**6a. Normalize tags to lowercase on save**

In `NoteEditor.tsx` and `QuickCaptureModal.tsx`, normalize tags to lowercase before saving:
```typescript
const normalizedTags = tags.map(t => t.trim().toLowerCase());
```

This prevents "Loot" vs "loot" drift without needing a separate table.

---

### Phase 7: Enable Realtime for `session_notes`

The `session_notes` table is NOT in the `supabase_realtime` publication. The realtime subscriptions in `NotesBoard.tsx` and `PlayerNotesView.tsx` are set up in code but won't actually receive any events.

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_notes;
```

---

## Summary of Database Changes (Single Migration)

```text
1. DROP + re-ADD note_links_link_type_check (add NOTE, CHARACTER)
2. ADD version INTEGER column to session_notes
3. CREATE check_note_version trigger function + trigger
4. CREATE note_revisions table + indexes + RLS
5. ADD deleted_at column to session_notes + index
6. ADD unique constraint on note_links
7. ADD session_notes to realtime publication
```

## Summary of Code Changes

| File | Changes |
|------|---------|
| `NoteEditor.tsx` | Version tracking, conflict detection, soft delete, revision creation, tag normalization, version history UI |
| `NotesBoard.tsx` | Filter out deleted_at, add Trash tab |
| `NoteGraph.tsx` | Filter out deleted_at |
| `PlayerNotesView.tsx` | Fix `players` to `SHARED`, filter out deleted_at |
| `WikilinkAutocomplete.tsx` | Filter out deleted_at |
| `NoteBacklinks.tsx` | Filter out deleted_at |
| `NoteFolderSelector.tsx` | Filter out deleted_at |

## What Is NOT Changed

- All existing UI layout, routing, and component structure
- All existing @mention and wikilink parsing logic
- Tags system (predefined + custom)
- Folder/notebook organization
- Graph view
- Outline sidebar
- Quick capture (Cmd+J)
- All RLS policies on session_notes (existing ones still apply)
- AddItemToSessionDialog integration

## Implementation Order

1. Database migration (all schema changes in one migration)
2. Fix PlayerNotesView visibility bug
3. Add soft-delete filtering to all components
4. Add version tracking to NoteEditor
5. Add revision history table writes + UI
6. Add tag normalization
