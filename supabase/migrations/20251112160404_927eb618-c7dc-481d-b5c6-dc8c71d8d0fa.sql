-- Phase 1: Create junction tables for session content

-- Link quests to sessions (many-to-many)
CREATE TABLE IF NOT EXISTS public.session_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.campaign_sessions(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  completed_in_session BOOLEAN DEFAULT false,
  carry_over_from_session_id UUID REFERENCES public.campaign_sessions(id),
  notes TEXT,
  UNIQUE(session_id, quest_id)
);

-- Link encounters to sessions (preload encounters)
CREATE TABLE IF NOT EXISTS public.session_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.campaign_sessions(id) ON DELETE CASCADE,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  launched BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(session_id, encounter_id)
);

-- Link NPCs to sessions
CREATE TABLE IF NOT EXISTS public.session_npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.campaign_sessions(id) ON DELETE CASCADE,
  npc_id UUID NOT NULL REFERENCES public.npcs(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  appeared_in_session BOOLEAN DEFAULT false,
  notes TEXT,
  UNIQUE(session_id, npc_id)
);

-- Link handouts to sessions
CREATE TABLE IF NOT EXISTS public.session_handouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.campaign_sessions(id) ON DELETE CASCADE,
  handout_id UUID NOT NULL REFERENCES public.handouts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  revealed_in_session BOOLEAN DEFAULT false,
  UNIQUE(session_id, handout_id)
);

-- Link locations to sessions
CREATE TABLE IF NOT EXISTS public.session_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.campaign_sessions(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  visited_in_session BOOLEAN DEFAULT false,
  UNIQUE(session_id, location_id)
);

-- Enable RLS on all junction tables
ALTER TABLE public.session_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_handouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_quests
CREATE POLICY "Campaign members can view session quests"
  ON public.session_quests FOR SELECT
  USING (
    session_id IN (
      SELECT cs.id FROM public.campaign_sessions cs
      JOIN public.campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid() OR is_campaign_member(c.id, auth.uid())
    )
  );

CREATE POLICY "DMs can manage session quests"
  ON public.session_quests FOR ALL
  USING (
    session_id IN (
      SELECT cs.id FROM public.campaign_sessions cs
      JOIN public.campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid()
    )
  );

-- RLS Policies for session_encounters
CREATE POLICY "Campaign members can view session encounters"
  ON public.session_encounters FOR SELECT
  USING (
    session_id IN (
      SELECT cs.id FROM public.campaign_sessions cs
      JOIN public.campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid() OR is_campaign_member(c.id, auth.uid())
    )
  );

CREATE POLICY "DMs can manage session encounters"
  ON public.session_encounters FOR ALL
  USING (
    session_id IN (
      SELECT cs.id FROM public.campaign_sessions cs
      JOIN public.campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid()
    )
  );

-- RLS Policies for session_npcs
CREATE POLICY "Campaign members can view session npcs"
  ON public.session_npcs FOR SELECT
  USING (
    session_id IN (
      SELECT cs.id FROM public.campaign_sessions cs
      JOIN public.campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid() OR is_campaign_member(c.id, auth.uid())
    )
  );

CREATE POLICY "DMs can manage session npcs"
  ON public.session_npcs FOR ALL
  USING (
    session_id IN (
      SELECT cs.id FROM public.campaign_sessions cs
      JOIN public.campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid()
    )
  );

-- RLS Policies for session_handouts
CREATE POLICY "Campaign members can view session handouts"
  ON public.session_handouts FOR SELECT
  USING (
    session_id IN (
      SELECT cs.id FROM public.campaign_sessions cs
      JOIN public.campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid() OR is_campaign_member(c.id, auth.uid())
    )
  );

CREATE POLICY "DMs can manage session handouts"
  ON public.session_handouts FOR ALL
  USING (
    session_id IN (
      SELECT cs.id FROM public.campaign_sessions cs
      JOIN public.campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid()
    )
  );

-- RLS Policies for session_locations
CREATE POLICY "Campaign members can view session locations"
  ON public.session_locations FOR SELECT
  USING (
    session_id IN (
      SELECT cs.id FROM public.campaign_sessions cs
      JOIN public.campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid() OR is_campaign_member(c.id, auth.uid())
    )
  );

CREATE POLICY "DMs can manage session locations"
  ON public.session_locations FOR ALL
  USING (
    session_id IN (
      SELECT cs.id FROM public.campaign_sessions cs
      JOIN public.campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid()
    )
  );

-- Phase 4: Auto-carryover function for in-progress quests
CREATE OR REPLACE FUNCTION public.auto_carryover_quests()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a session ends (status changes to 'ended')
  IF NEW.status = 'ended' AND OLD.status != 'ended' THEN
    -- Find all in-progress quests assigned to this session
    INSERT INTO public.session_quests (session_id, quest_id, carry_over_from_session_id, notes)
    SELECT 
      (SELECT id FROM public.campaign_sessions 
       WHERE campaign_id = NEW.campaign_id 
       AND status = 'scheduled' 
       AND started_at > NEW.ended_at
       ORDER BY started_at ASC 
       LIMIT 1) as next_session_id,
      sq.quest_id,
      NEW.id as carry_over_from_session_id,
      'Auto-carried from previous session'
    FROM public.session_quests sq
    JOIN public.quests q ON q.id = sq.quest_id
    WHERE sq.session_id = NEW.id
      AND q.status = 'in_progress'
      AND sq.completed_in_session = false
      AND EXISTS (
        SELECT 1 FROM public.campaign_sessions 
        WHERE campaign_id = NEW.campaign_id 
        AND status = 'scheduled' 
        AND started_at > NEW.ended_at
      )
    ON CONFLICT (session_id, quest_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-carryover
DROP TRIGGER IF EXISTS trigger_auto_carryover_quests ON public.campaign_sessions;
CREATE TRIGGER trigger_auto_carryover_quests
AFTER UPDATE ON public.campaign_sessions
FOR EACH ROW
EXECUTE FUNCTION public.auto_carryover_quests();