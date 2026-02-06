
-- Add folder column for notebook organization
ALTER TABLE public.session_notes ADD COLUMN folder TEXT DEFAULT NULL;

-- Index for efficient folder-based queries
CREATE INDEX idx_session_notes_folder ON public.session_notes(campaign_id, folder);
