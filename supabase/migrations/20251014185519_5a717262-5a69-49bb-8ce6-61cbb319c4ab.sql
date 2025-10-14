-- Add slug column for Open5e compatibility
ALTER TABLE public.monster_catalog ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add indexes for fast search
CREATE INDEX IF NOT EXISTS idx_monster_catalog_lower_name ON public.monster_catalog (lower(name));
CREATE INDEX IF NOT EXISTS idx_monster_catalog_cr ON public.monster_catalog (cr);
CREATE INDEX IF NOT EXISTS idx_monster_catalog_type ON public.monster_catalog (type);
CREATE INDEX IF NOT EXISTS idx_monster_catalog_size ON public.monster_catalog (size);

-- Update RLS to ensure clients can only read
REVOKE INSERT, UPDATE, DELETE ON public.monster_catalog FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.monster_catalog FROM authenticated;