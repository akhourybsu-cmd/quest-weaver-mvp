-- Phase 19: Spell Management 2.0 Database Schema

-- ============================================
-- 1. CUSTOM SPELLS TABLE
-- ============================================

-- Create custom spells table for user-created spells
CREATE TABLE IF NOT EXISTS public.custom_spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 0 AND level <= 9),
  school TEXT NOT NULL,
  casting_time TEXT NOT NULL,
  range TEXT NOT NULL,
  components JSONB DEFAULT '{"verbal": false, "somatic": false, "material": false, "material_description": null}',
  duration TEXT NOT NULL,
  concentration BOOLEAN DEFAULT false,
  ritual BOOLEAN DEFAULT false,
  description TEXT NOT NULL,
  higher_levels TEXT,
  classes TEXT[] DEFAULT '{}',
  damage_type TEXT,
  save_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. SPELL PREPARATION TRACKING
-- ============================================

-- Add preparation tracking columns to character_spells
ALTER TABLE public.character_spells
ADD COLUMN IF NOT EXISTS can_be_prepared BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS preparation_date DATE,
ADD COLUMN IF NOT EXISTS is_ritual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_always_prepared BOOLEAN DEFAULT false;

-- Create spell preparation sessions table
CREATE TABLE IF NOT EXISTS public.spell_preparation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  prepared_at TIMESTAMPTZ DEFAULT now(),
  spell_ids UUID[] DEFAULT '{}',
  notes TEXT
);

-- ============================================
-- 3. SPELL SLOTS TRACKING ENHANCEMENTS
-- ============================================

-- Create spell slots tracking table for more granular control
CREATE TABLE IF NOT EXISTS public.character_spell_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  spell_level INTEGER NOT NULL CHECK (spell_level >= 1 AND spell_level <= 9),
  max_slots INTEGER NOT NULL DEFAULT 0,
  used_slots INTEGER NOT NULL DEFAULT 0,
  bonus_slots INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, spell_level)
);

-- ============================================
-- 4. RITUAL CASTING TRACKING
-- ============================================

-- Add ritual casting ability to characters
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS can_cast_rituals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ritual_casting_notes TEXT;

-- ============================================
-- 5. SPELLBOOK ENTRIES (for Wizards, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS public.spellbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  spell_id UUID,
  custom_spell_id UUID REFERENCES public.custom_spells(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  learned_at_level INTEGER,
  cost_paid INTEGER DEFAULT 0,
  notes TEXT,
  CONSTRAINT spell_reference CHECK (
    (spell_id IS NOT NULL AND custom_spell_id IS NULL) OR
    (spell_id IS NULL AND custom_spell_id IS NOT NULL)
  )
);

-- ============================================
-- 6. SPELL CASTING HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS public.spell_casting_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id),
  spell_id UUID,
  custom_spell_id UUID REFERENCES public.custom_spells(id),
  spell_level_cast INTEGER NOT NULL,
  was_ritual BOOLEAN DEFAULT false,
  was_upcast BOOLEAN DEFAULT false,
  target_info JSONB,
  cast_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Custom Spells
ALTER TABLE public.custom_spells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view custom spells"
  ON public.custom_spells FOR SELECT
  USING (campaign_id IN (
    SELECT id FROM public.campaigns
    WHERE dm_user_id = auth.uid() OR id IN (
      SELECT campaign_id FROM public.characters WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "DMs and creators can manage custom spells"
  ON public.custom_spells FOR ALL
  USING (
    created_by = auth.uid() OR
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE dm_user_id = auth.uid()
    )
  );

-- Spell Preparation Sessions
ALTER TABLE public.spell_preparation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their preparation sessions"
  ON public.spell_preparation_sessions FOR SELECT
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their preparation sessions"
  ON public.spell_preparation_sessions FOR ALL
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "DMs can view campaign preparation sessions"
  ON public.spell_preparation_sessions FOR SELECT
  USING (character_id IN (
    SELECT c.id FROM public.characters c
    JOIN public.campaigns camp ON c.campaign_id = camp.id
    WHERE camp.dm_user_id = auth.uid()
  ));

-- Character Spell Slots
ALTER TABLE public.character_spell_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their spell slots"
  ON public.character_spell_slots FOR SELECT
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their spell slots"
  ON public.character_spell_slots FOR ALL
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "DMs can view campaign spell slots"
  ON public.character_spell_slots FOR SELECT
  USING (character_id IN (
    SELECT c.id FROM public.characters c
    JOIN public.campaigns camp ON c.campaign_id = camp.id
    WHERE camp.dm_user_id = auth.uid()
  ));

-- Spellbook Entries
ALTER TABLE public.spellbook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their spellbook"
  ON public.spellbook_entries FOR SELECT
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their spellbook"
  ON public.spellbook_entries FOR ALL
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "DMs can view campaign spellbooks"
  ON public.spellbook_entries FOR SELECT
  USING (character_id IN (
    SELECT c.id FROM public.characters c
    JOIN public.campaigns camp ON c.campaign_id = camp.id
    WHERE camp.dm_user_id = auth.uid()
  ));

-- Spell Casting History
ALTER TABLE public.spell_casting_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their casting history"
  ON public.spell_casting_history FOR SELECT
  USING (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert casting history"
  ON public.spell_casting_history FOR INSERT
  WITH CHECK (character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "DMs can view campaign casting history"
  ON public.spell_casting_history FOR SELECT
  USING (character_id IN (
    SELECT c.id FROM public.characters c
    JOIN public.campaigns camp ON c.campaign_id = camp.id
    WHERE camp.dm_user_id = auth.uid()
  ));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_custom_spells_campaign ON public.custom_spells(campaign_id);
CREATE INDEX IF NOT EXISTS idx_custom_spells_level ON public.custom_spells(level);
CREATE INDEX IF NOT EXISTS idx_spell_preparation_character ON public.spell_preparation_sessions(character_id);
CREATE INDEX IF NOT EXISTS idx_spell_slots_character ON public.character_spell_slots(character_id);
CREATE INDEX IF NOT EXISTS idx_spellbook_character ON public.spellbook_entries(character_id);
CREATE INDEX IF NOT EXISTS idx_casting_history_character ON public.spell_casting_history(character_id);
CREATE INDEX IF NOT EXISTS idx_casting_history_encounter ON public.spell_casting_history(encounter_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to reset spell slots for a character
CREATE OR REPLACE FUNCTION reset_spell_slots(char_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.character_spell_slots
  SET used_slots = 0
  WHERE character_id = char_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get prepared spells count
CREATE OR REPLACE FUNCTION get_prepared_spell_count(char_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.character_spells
  WHERE character_id = char_id AND prepared = true;
$$ LANGUAGE sql SECURITY DEFINER;