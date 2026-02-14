
-- Create the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- DM Character Notes table
CREATE TABLE public.dm_character_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  content_markdown TEXT DEFAULT '',
  hooks TEXT DEFAULT '',
  secrets TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, character_id)
);

ALTER TABLE public.dm_character_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DM can view own character notes"
  ON public.dm_character_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = dm_character_notes.campaign_id AND campaigns.dm_user_id = auth.uid()));

CREATE POLICY "DM can insert character notes"
  ON public.dm_character_notes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = dm_character_notes.campaign_id AND campaigns.dm_user_id = auth.uid()));

CREATE POLICY "DM can update character notes"
  ON public.dm_character_notes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = dm_character_notes.campaign_id AND campaigns.dm_user_id = auth.uid()));

CREATE POLICY "DM can delete character notes"
  ON public.dm_character_notes FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = dm_character_notes.campaign_id AND campaigns.dm_user_id = auth.uid()));

-- Session Attendance table
CREATE TABLE public.session_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.campaign_sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT true,
  inspiration_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, character_id)
);

ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DM can view session attendance"
  ON public.session_attendance FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.campaign_sessions cs JOIN public.campaigns c ON c.id = cs.campaign_id WHERE cs.id = session_attendance.session_id AND c.dm_user_id = auth.uid()));

CREATE POLICY "DM can insert session attendance"
  ON public.session_attendance FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaign_sessions cs JOIN public.campaigns c ON c.id = cs.campaign_id WHERE cs.id = session_attendance.session_id AND c.dm_user_id = auth.uid()));

CREATE POLICY "DM can update session attendance"
  ON public.session_attendance FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.campaign_sessions cs JOIN public.campaigns c ON c.id = cs.campaign_id WHERE cs.id = session_attendance.session_id AND c.dm_user_id = auth.uid()));

CREATE POLICY "DM can delete session attendance"
  ON public.session_attendance FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.campaign_sessions cs JOIN public.campaigns c ON c.id = cs.campaign_id WHERE cs.id = session_attendance.session_id AND c.dm_user_id = auth.uid()));

-- Timestamp trigger for dm_character_notes
CREATE TRIGGER update_dm_character_notes_updated_at
  BEFORE UPDATE ON public.dm_character_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
