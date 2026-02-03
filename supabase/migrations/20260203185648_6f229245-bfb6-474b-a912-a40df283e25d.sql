-- Create unified markers table for all persistent map annotations
CREATE TABLE public.map_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES public.maps(id) ON DELETE CASCADE NOT NULL,
  marker_type TEXT NOT NULL DEFAULT 'note',
  shape TEXT NOT NULL DEFAULT 'circle',
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL,
  height REAL,
  rotation REAL DEFAULT 0,
  color TEXT DEFAULT '#ffffff',
  opacity REAL DEFAULT 1,
  icon TEXT,
  label TEXT,
  dm_only BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime for map_markers
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_markers;

-- Enable RLS
ALTER TABLE public.map_markers ENABLE ROW LEVEL SECURITY;

-- DMs can manage markers on their campaign maps
CREATE POLICY "DMs can manage markers"
  ON public.map_markers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.maps m
      JOIN public.campaigns c ON m.campaign_id = c.id
      WHERE m.id = map_markers.map_id
      AND c.dm_user_id = auth.uid()
    )
  );

-- Players can view non-DM-only markers
CREATE POLICY "Players can view public markers"
  ON public.map_markers FOR SELECT
  USING (
    dm_only = false OR
    EXISTS (
      SELECT 1 FROM public.maps m
      JOIN public.campaigns c ON m.campaign_id = c.id
      WHERE m.id = map_markers.map_id
      AND c.dm_user_id = auth.uid()
    )
  );

-- Enable realtime for existing overlay tables (if not already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'aoe_templates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.aoe_templates;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'fog_regions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fog_regions;
  END IF;
END $$;