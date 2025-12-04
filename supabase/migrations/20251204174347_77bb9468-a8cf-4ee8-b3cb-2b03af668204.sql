-- Create campaign_eras table for ordering eras in history timeline
CREATE TABLE public.campaign_eras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_eras ENABLE ROW LEVEL SECURITY;

-- DMs can manage eras
CREATE POLICY "DMs can manage campaign eras"
ON public.campaign_eras
FOR ALL
USING (campaign_id IN (
  SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
));

-- Campaign members can view eras
CREATE POLICY "Campaign members can view eras"
ON public.campaign_eras
FOR SELECT
USING (campaign_id IN (
  SELECT c.id FROM campaigns c
  WHERE c.dm_user_id = auth.uid()
  OR c.id IN (SELECT campaign_id FROM characters WHERE user_id = auth.uid())
));

-- Add era_id to lore_pages details for proper linking
COMMENT ON TABLE public.campaign_eras IS 'Stores campaign-specific era definitions for history timeline ordering';