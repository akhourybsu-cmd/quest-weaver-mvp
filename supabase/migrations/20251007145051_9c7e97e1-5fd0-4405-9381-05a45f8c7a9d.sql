-- Create handouts table
CREATE TABLE IF NOT EXISTS public.handouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image')),
  content_url TEXT,
  content_text TEXT,
  is_revealed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create loot_items table
CREATE TABLE IF NOT EXISTS public.loot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
  assigned_to_character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  value_gp INTEGER NOT NULL DEFAULT 0,
  is_magic BOOLEAN DEFAULT false,
  identified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create npcs table
CREATE TABLE IF NOT EXISTS public.npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  description TEXT,
  location TEXT,
  portrait_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create quests table
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quest_giver TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create quest_steps table
CREATE TABLE IF NOT EXISTS public.quest_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  step_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.handouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_steps ENABLE ROW LEVEL SECURITY;

-- Handouts policies
CREATE POLICY "Campaign members can view revealed handouts"
  ON public.handouts FOR SELECT
  USING (
    is_revealed = true AND
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE dm_user_id = auth.uid() 
      OR id IN (SELECT campaign_id FROM public.characters WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "DMs can view all handouts"
  ON public.handouts FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE dm_user_id = auth.uid()
    )
  );

CREATE POLICY "DMs can manage handouts"
  ON public.handouts FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE dm_user_id = auth.uid()
    )
  );

-- Loot items policies
CREATE POLICY "Campaign members can view loot"
  ON public.loot_items FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE dm_user_id = auth.uid() 
      OR id IN (SELECT campaign_id FROM public.characters WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "DMs can manage loot"
  ON public.loot_items FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE dm_user_id = auth.uid()
    )
  );

-- NPCs policies
CREATE POLICY "Campaign members can view NPCs"
  ON public.npcs FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE dm_user_id = auth.uid() 
      OR id IN (SELECT campaign_id FROM public.characters WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "DMs can manage NPCs"
  ON public.npcs FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE dm_user_id = auth.uid()
    )
  );

-- Quests policies
CREATE POLICY "Campaign members can view quests"
  ON public.quests FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE dm_user_id = auth.uid() 
      OR id IN (SELECT campaign_id FROM public.characters WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "DMs can manage quests"
  ON public.quests FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE dm_user_id = auth.uid()
    )
  );

-- Quest steps policies
CREATE POLICY "Campaign members can view quest steps"
  ON public.quest_steps FOR SELECT
  USING (
    quest_id IN (
      SELECT id FROM public.quests 
      WHERE campaign_id IN (
        SELECT id FROM public.campaigns 
        WHERE dm_user_id = auth.uid() 
        OR id IN (SELECT campaign_id FROM public.characters WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "DMs can manage quest steps"
  ON public.quest_steps FOR ALL
  USING (
    quest_id IN (
      SELECT id FROM public.quests 
      WHERE campaign_id IN (
        SELECT id FROM public.campaigns WHERE dm_user_id = auth.uid()
      )
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.handouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loot_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.npcs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quest_steps;