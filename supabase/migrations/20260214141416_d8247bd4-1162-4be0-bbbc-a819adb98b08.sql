
-- 1. Add map_type and player_visible to maps table
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS map_type text DEFAULT 'battle';
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS player_visible boolean DEFAULT true;

-- 2. Add faction_type to factions
ALTER TABLE public.factions ADD COLUMN IF NOT EXISTS faction_type text;

-- 3. Create plot_threads table
CREATE TABLE public.plot_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  truth TEXT,
  party_knowledge TEXT,
  branching_notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plot_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DMs can manage plot threads" ON public.plot_threads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.dm_user_id = auth.uid())
  );

CREATE TRIGGER update_plot_threads_updated_at
  BEFORE UPDATE ON public.plot_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create plot_thread_links junction table
CREATE TABLE public.plot_thread_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.plot_threads(id) ON DELETE CASCADE,
  linked_type TEXT NOT NULL,
  linked_id UUID NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plot_thread_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DMs can manage plot thread links" ON public.plot_thread_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM plot_threads pt 
      JOIN campaigns c ON c.id = pt.campaign_id 
      WHERE pt.id = thread_id AND c.dm_user_id = auth.uid()
    )
  );

-- 5. Enable realtime for plot_threads
ALTER PUBLICATION supabase_realtime ADD TABLE public.plot_threads;
