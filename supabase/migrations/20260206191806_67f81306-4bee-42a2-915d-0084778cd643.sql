
-- Phase 1a: Fix note_links CHECK constraint to include NOTE and CHARACTER
ALTER TABLE public.note_links DROP CONSTRAINT IF EXISTS note_links_link_type_check;
ALTER TABLE public.note_links ADD CONSTRAINT note_links_link_type_check 
  CHECK (link_type = ANY (ARRAY['NPC','LOCATION','QUEST','ITEM','FACTION','ENCOUNTER','NOTE','CHARACTER']));

-- Phase 2a: Add version column to session_notes
ALTER TABLE public.session_notes ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Phase 2b: Create concurrency check trigger
CREATE OR REPLACE FUNCTION public.check_note_version()
RETURNS trigger AS $$
BEGIN
  IF OLD.version != NEW.version THEN
    RAISE EXCEPTION 'Conflict: note was modified by another user (expected version %, got %)', OLD.version, NEW.version;
  END IF;
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_note_version ON public.session_notes;
CREATE TRIGGER trg_check_note_version
  BEFORE UPDATE ON public.session_notes
  FOR EACH ROW EXECUTE FUNCTION public.check_note_version();

-- Phase 3a: Create note_revisions table
CREATE TABLE IF NOT EXISTS public.note_revisions (
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

CREATE INDEX IF NOT EXISTS idx_note_revisions_note ON public.note_revisions(note_id, version DESC);

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

-- Phase 4a: Add deleted_at column to session_notes
ALTER TABLE public.session_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_session_notes_deleted ON public.session_notes(deleted_at) WHERE deleted_at IS NOT NULL;

-- Phase 5a: Add uniqueness constraint on note_links
ALTER TABLE public.note_links 
  ADD CONSTRAINT note_links_unique_link UNIQUE (note_id, link_type, link_id, label);

-- Phase 7: Enable realtime for session_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_notes;
