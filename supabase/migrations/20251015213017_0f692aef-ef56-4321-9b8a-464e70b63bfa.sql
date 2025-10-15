-- Phase 3: Session Notes & Logs System

-- Create sessions table if it doesn't exist (referenced by session_notes)
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  session_number integer NOT NULL,
  title text,
  session_date date,
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, session_number)
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view sessions"
ON public.sessions FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns 
    WHERE dm_user_id = auth.uid() 
    OR id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "DMs can manage sessions"
ON public.sessions FOR ALL
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  )
);

-- Session notes table with rich content
CREATE TABLE public.session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  author_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  content_markdown text,
  visibility text CHECK (visibility IN ('DM_ONLY','SHARED','PRIVATE')) DEFAULT 'DM_ONLY',
  tags text[] DEFAULT '{}',
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view appropriate notes"
ON public.session_notes FOR SELECT
USING (
  campaign_id IN (
    SELECT c.id FROM campaigns c 
    WHERE (c.dm_user_id = auth.uid() OR c.id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    ))
  )
  AND (
    visibility = 'SHARED'
    OR (visibility = 'DM_ONLY' AND campaign_id IN (SELECT id FROM campaigns WHERE dm_user_id = auth.uid()))
    OR (visibility = 'PRIVATE' AND author_id = auth.uid())
  )
);

CREATE POLICY "Campaign members can create notes"
ON public.session_notes FOR INSERT
WITH CHECK (
  campaign_id IN (
    SELECT c.id FROM campaigns c 
    WHERE (c.dm_user_id = auth.uid() OR c.id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    ))
  )
  AND author_id = auth.uid()
);

CREATE POLICY "Authors and DMs can update notes"
ON public.session_notes FOR UPDATE
USING (
  author_id = auth.uid()
  OR (campaign_id IN (SELECT id FROM campaigns WHERE dm_user_id = auth.uid()))
);

CREATE POLICY "Authors and DMs can delete notes"
ON public.session_notes FOR DELETE
USING (
  author_id = auth.uid()
  OR (campaign_id IN (SELECT id FROM campaigns WHERE dm_user_id = auth.uid()))
);

-- Note links to world entities
CREATE TABLE public.note_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES public.session_notes(id) ON DELETE CASCADE NOT NULL,
  link_type text CHECK (link_type IN ('NPC','LOCATION','QUEST','ITEM','FACTION','ENCOUNTER')) NOT NULL,
  link_id uuid,
  label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.note_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view note links"
ON public.note_links FOR SELECT
USING (
  note_id IN (SELECT id FROM session_notes WHERE campaign_id IN (
    SELECT c.id FROM campaigns c 
    WHERE (c.dm_user_id = auth.uid() OR c.id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    ))
  ))
);

CREATE POLICY "Note authors and DMs can manage links"
ON public.note_links FOR ALL
USING (
  note_id IN (
    SELECT id FROM session_notes 
    WHERE author_id = auth.uid() 
    OR campaign_id IN (SELECT id FROM campaigns WHERE dm_user_id = auth.uid())
  )
);

-- Session highlights (memorable moments)
CREATE TABLE public.session_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  text text NOT NULL,
  color text DEFAULT 'neutral',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view highlights"
ON public.session_highlights FOR SELECT
USING (
  campaign_id IN (
    SELECT c.id FROM campaigns c 
    WHERE (c.dm_user_id = auth.uid() OR c.id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "DMs can manage highlights"
ON public.session_highlights FOR ALL
USING (
  campaign_id IN (SELECT id FROM campaigns WHERE dm_user_id = auth.uid())
);

-- Indexes for performance
CREATE INDEX idx_session_notes_campaign ON public.session_notes(campaign_id);
CREATE INDEX idx_session_notes_session ON public.session_notes(session_id);
CREATE INDEX idx_session_notes_author ON public.session_notes(author_id);
CREATE INDEX idx_session_notes_visibility ON public.session_notes(visibility);
CREATE INDEX idx_session_notes_tags ON public.session_notes USING GIN(tags);
CREATE INDEX idx_note_links_note ON public.note_links(note_id);
CREATE INDEX idx_note_links_type ON public.note_links(link_type, link_id);
CREATE INDEX idx_session_highlights_campaign ON public.session_highlights(campaign_id);
CREATE INDEX idx_session_highlights_session ON public.session_highlights(session_id);

-- Trigger for updated_at
CREATE TRIGGER update_session_notes_updated_at
  BEFORE UPDATE ON public.session_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();