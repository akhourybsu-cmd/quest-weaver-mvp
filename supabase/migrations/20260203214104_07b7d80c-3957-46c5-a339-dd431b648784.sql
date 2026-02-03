-- Add lore_page_id column to core asset tables for bidirectional lore linking
ALTER TABLE public.factions ADD COLUMN IF NOT EXISTS lore_page_id UUID REFERENCES public.lore_pages(id) ON DELETE SET NULL;
ALTER TABLE public.npcs ADD COLUMN IF NOT EXISTS lore_page_id UUID REFERENCES public.lore_pages(id) ON DELETE SET NULL;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS lore_page_id UUID REFERENCES public.lore_pages(id) ON DELETE SET NULL;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS lore_page_id UUID REFERENCES public.lore_pages(id) ON DELETE SET NULL;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS lore_page_id UUID REFERENCES public.lore_pages(id) ON DELETE SET NULL;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_factions_lore_page ON public.factions(lore_page_id) WHERE lore_page_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_npcs_lore_page ON public.npcs(lore_page_id) WHERE lore_page_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_lore_page ON public.locations(lore_page_id) WHERE lore_page_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quests_lore_page ON public.quests(lore_page_id) WHERE lore_page_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_lore_page ON public.items(lore_page_id) WHERE lore_page_id IS NOT NULL;