-- Phase 18: Enhanced Character Management Database Schema

-- ============================================
-- 1. FEATS SYSTEM
-- ============================================

-- Create SRD feats table
CREATE TABLE IF NOT EXISTS public.srd_feats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prerequisites JSONB DEFAULT '{}',
  ability_increases JSONB DEFAULT '[]',
  grants JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create character feats tracking table
CREATE TABLE IF NOT EXISTS public.character_feats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  feat_id UUID NOT NULL REFERENCES public.srd_feats(id),
  level_gained INTEGER NOT NULL,
  choices JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. MULTICLASS SUPPORT
-- ============================================

-- Create character classes table for multiclassing
CREATE TABLE IF NOT EXISTS public.character_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.srd_classes(id),
  subclass_id UUID REFERENCES public.srd_subclasses(id),
  class_level INTEGER NOT NULL DEFAULT 1,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, class_id)
);

-- ============================================
-- 3. LEVEL-UP TRACKING
-- ============================================

-- Create level history table to track character progression
CREATE TABLE IF NOT EXISTS public.character_level_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.srd_classes(id),
  previous_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  hp_gained INTEGER NOT NULL,
  features_gained JSONB DEFAULT '[]',
  choices_made JSONB DEFAULT '{}',
  leveled_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. ENHANCED EQUIPMENT TRACKING
-- ============================================

-- Add additional columns to character_equipment for better management
ALTER TABLE public.character_equipment 
ADD COLUMN IF NOT EXISTS equipped_slot TEXT,
ADD COLUMN IF NOT EXISTS attunement_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_magical BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weight NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS value_gp NUMERIC(10,2) DEFAULT 0;

-- ============================================
-- 5. CHARACTER EXPORT METADATA
-- ============================================

-- Add export/import tracking
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS last_exported_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS export_version TEXT DEFAULT '1.0';

-- ============================================
-- RLS POLICIES
-- ============================================

-- SRD Feats (public read access)
ALTER TABLE public.srd_feats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feats"
  ON public.srd_feats FOR SELECT
  USING (true);

-- Character Feats
ALTER TABLE public.character_feats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their character feats"
  ON public.character_feats FOR SELECT
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "DMs can view campaign character feats"
  ON public.character_feats FOR SELECT
  USING (character_id IN (
    SELECT c.id FROM public.characters c
    JOIN public.campaigns camp ON c.campaign_id = camp.id
    WHERE camp.dm_user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their character feats"
  ON public.character_feats FOR ALL
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

-- Character Classes
ALTER TABLE public.character_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their character classes"
  ON public.character_classes FOR SELECT
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "DMs can view campaign character classes"
  ON public.character_classes FOR SELECT
  USING (character_id IN (
    SELECT c.id FROM public.characters c
    JOIN public.campaigns camp ON c.campaign_id = camp.id
    WHERE camp.dm_user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their character classes"
  ON public.character_classes FOR ALL
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

-- Character Level History
ALTER TABLE public.character_level_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their character level history"
  ON public.character_level_history FOR SELECT
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "DMs can view campaign character level history"
  ON public.character_level_history FOR SELECT
  USING (character_id IN (
    SELECT c.id FROM public.characters c
    JOIN public.campaigns camp ON c.campaign_id = camp.id
    WHERE camp.dm_user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their character level history"
  ON public.character_level_history FOR ALL
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_character_feats_character_id ON public.character_feats(character_id);
CREATE INDEX IF NOT EXISTS idx_character_classes_character_id ON public.character_classes(character_id);
CREATE INDEX IF NOT EXISTS idx_character_level_history_character_id ON public.character_level_history(character_id);
CREATE INDEX IF NOT EXISTS idx_srd_feats_name ON public.srd_feats(name);