-- Add comprehensive homebrew item support
-- Note: items.properties is already JSONB, we're documenting the expanded schema

-- Add item template library table
CREATE TABLE IF NOT EXISTS public.item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'weapon', 'armor', 'potion', 'scroll', 'wondrous', 'poison'
  template_data JSONB NOT NULL, -- Pre-filled item properties
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.item_templates ENABLE ROW LEVEL SECURITY;

-- Templates are public read
CREATE POLICY "Templates are viewable by everyone"
  ON public.item_templates FOR SELECT
  USING (true);

-- Only admins can manage templates  
CREATE POLICY "Admins can manage templates"
  ON public.item_templates FOR ALL
  USING (is_current_user_admin());

-- Add item versioning table
CREATE TABLE IF NOT EXISTS public.item_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  changelog TEXT,
  properties JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.item_versions ENABLE ROW LEVEL SECURITY;

-- Version access follows item access
CREATE POLICY "Users can view versions of their campaign items"
  ON public.item_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN campaign_members cm ON cm.campaign_id = i.campaign_id
      WHERE i.id = item_versions.item_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "DMs can manage versions"
  ON public.item_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN campaign_members cm ON cm.campaign_id = i.campaign_id
      WHERE i.id = item_versions.item_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'DM'
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_item_versions_item_id ON public.item_versions(item_id);
CREATE INDEX IF NOT EXISTS idx_item_templates_category ON public.item_templates(category);

-- Add trigger for updated_at
CREATE TRIGGER update_item_templates_updated_at
  BEFORE UPDATE ON public.item_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.item_templates IS 'Pre-built item templates for quick creation';
COMMENT ON TABLE public.item_versions IS 'Version history for homebrew items';