-- Create lore_pages table
CREATE TABLE public.lore_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_md TEXT NOT NULL,
  excerpt TEXT,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL CHECK (visibility IN ('DM_ONLY', 'SHARED', 'PUBLIC')) DEFAULT 'DM_ONLY',
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, slug)
);

-- Create lore_links table
CREATE TABLE public.lore_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  source_page UUID NOT NULL REFERENCES public.lore_pages(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('LORE', 'NPC', 'LOCATION', 'FACTION', 'QUEST', 'ITEM', 'NOTE')),
  target_id UUID,
  label TEXT NOT NULL
);

-- Create lore_backlinks table
CREATE TABLE public.lore_backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.lore_pages(id) ON DELETE CASCADE,
  from_type TEXT NOT NULL,
  from_id UUID NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lore_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lore_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lore_backlinks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lore_pages
CREATE POLICY "Campaign members can view lore pages"
  ON public.lore_pages FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE dm_user_id = auth.uid() 
      OR id IN (
        SELECT campaign_id FROM characters WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "DMs can manage all lore pages"
  ON public.lore_pages FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
    )
  );

CREATE POLICY "Players can create their own lore pages"
  ON public.lore_pages FOR INSERT
  WITH CHECK (
    author_id = auth.uid() 
    AND campaign_id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    )
    AND visibility IN ('SHARED', 'DM_ONLY')
  );

CREATE POLICY "Players can update their own lore pages"
  ON public.lore_pages FOR UPDATE
  USING (author_id = auth.uid());

-- RLS Policies for lore_links
CREATE POLICY "Campaign members can view lore links"
  ON public.lore_links FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE dm_user_id = auth.uid() 
      OR id IN (
        SELECT campaign_id FROM characters WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "DMs can manage lore links"
  ON public.lore_links FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can manage their page links"
  ON public.lore_links FOR ALL
  USING (
    source_page IN (
      SELECT id FROM lore_pages WHERE author_id = auth.uid()
    )
  );

-- RLS Policies for lore_backlinks
CREATE POLICY "Campaign members can view backlinks"
  ON public.lore_backlinks FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE dm_user_id = auth.uid() 
      OR id IN (
        SELECT campaign_id FROM characters WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "DMs can manage backlinks"
  ON public.lore_backlinks FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_lore_pages_campaign ON public.lore_pages(campaign_id);
CREATE INDEX idx_lore_pages_slug ON public.lore_pages(campaign_id, slug);
CREATE INDEX idx_lore_links_source ON public.lore_links(source_page);
CREATE INDEX idx_lore_links_target ON public.lore_links(target_type, target_id);
CREATE INDEX idx_lore_backlinks_page ON public.lore_backlinks(page_id);

-- Trigger for updated_at
CREATE TRIGGER update_lore_pages_updated_at
  BEFORE UPDATE ON public.lore_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();