CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.rules_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_api TEXT NOT NULL CHECK (source_api IN ('open5e_v2', 'dnd5eapi_2014', 'open5e_v1')),
  source_url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_key TEXT NOT NULL,
  content_slug TEXT,
  content_name TEXT NOT NULL,
  ruleset_version TEXT,
  source_document TEXT,
  raw_json JSONB NOT NULL,
  normalized_json JSONB NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_api, content_type, content_key)
);

CREATE INDEX idx_rules_cache_lookup ON public.rules_cache (content_type, content_key);
CREATE INDEX idx_rules_cache_name_trgm ON public.rules_cache USING GIN (lower(content_name) gin_trgm_ops);
CREATE INDEX idx_rules_cache_synced ON public.rules_cache (last_synced_at);

ALTER TABLE public.rules_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rules cache"
  ON public.rules_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER update_rules_cache_updated_at
  BEFORE UPDATE ON public.rules_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();