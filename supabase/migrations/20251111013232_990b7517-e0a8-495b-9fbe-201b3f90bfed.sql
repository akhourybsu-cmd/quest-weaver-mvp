-- =====================================================
-- PHASE 0: RULES ENGINE FOUNDATION
-- Core tables for character progression & rules
-- =====================================================

-- ==================== CLASS FEATURES ====================
CREATE TABLE IF NOT EXISTS public.class_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.srd_classes(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 20),
  name TEXT NOT NULL,
  description TEXT,
  rules_json JSONB DEFAULT '{}'::jsonb,
  choices_json JSONB DEFAULT '{}'::jsonb,
  grants_json JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_class_features_class ON public.class_features(class_id, level);

-- ==================== SUBCLASS FEATURES ====================
CREATE TABLE IF NOT EXISTS public.subclass_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subclass_id UUID REFERENCES public.srd_subclasses(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 20),
  name TEXT NOT NULL,
  description TEXT,
  rules_json JSONB DEFAULT '{}'::jsonb,
  choices_json JSONB DEFAULT '{}'::jsonb,
  grants_json JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subclass_features_subclass ON public.subclass_features(subclass_id, level);

-- ==================== CHARACTER CLASS LEVELS ====================
-- Track multiclassing progression
CREATE TABLE IF NOT EXISTS public.character_class_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.srd_classes(id),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 20),
  subclass_id UUID REFERENCES public.srd_subclasses(id),
  hp_gained INTEGER NOT NULL DEFAULT 0,
  hit_dice_remaining INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_character_class_levels_char ON public.character_class_levels(character_id);

-- ==================== CHARACTER FEATURE CHOICES ====================
-- Store player choices for features with options
CREATE TABLE IF NOT EXISTS public.character_feature_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  feature_id UUID, -- Can be class_features or subclass_features
  feature_type TEXT NOT NULL CHECK (feature_type IN ('class', 'subclass')),
  choice_key TEXT NOT NULL,
  value_json JSONB NOT NULL,
  level_gained INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, feature_id, choice_key)
);

CREATE INDEX idx_character_feature_choices_char ON public.character_feature_choices(character_id);

-- ==================== CHARACTER RESOURCES ====================
-- Unified resource tracking (replaces ad-hoc resources jsonb)
CREATE TABLE IF NOT EXISTS public.character_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  resource_key TEXT NOT NULL,
  label TEXT NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  max_value INTEGER NOT NULL DEFAULT 0,
  max_formula TEXT, -- e.g., "level", "floor((level+1)/2)", "3+proficiency_bonus"
  recharge TEXT NOT NULL CHECK (recharge IN ('short', 'long', 'daily', 'never', 'manual')),
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, resource_key)
);

CREATE INDEX idx_character_resources_char ON public.character_resources(character_id);

-- ==================== SPELLS KNOWN ====================
-- Track which spells a character knows/prepared
CREATE TABLE IF NOT EXISTS public.character_spells_known (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  spell_id UUID, -- References srd_spells or custom_spells
  spell_type TEXT NOT NULL CHECK (spell_type IN ('srd', 'custom')),
  learned_at_level INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('class', 'subclass', 'feat', 'item', 'scroll')),
  is_prepared BOOLEAN DEFAULT false,
  is_always_prepared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, spell_id, spell_type)
);

CREATE INDEX idx_character_spells_known_char ON public.character_spells_known(character_id);
CREATE INDEX idx_character_spells_known_prepared ON public.character_spells_known(character_id, is_prepared) WHERE is_prepared = true;

-- ==================== FEATS TABLE ====================
-- Store feat definitions
CREATE TABLE IF NOT EXISTS public.feats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  rules_json JSONB DEFAULT '{}'::jsonb,
  prerequisites_json JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'PHB',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== CHARACTER LEVEL HISTORY ====================
-- Enhance existing table if it exists, or create it
CREATE TABLE IF NOT EXISTS public.character_level_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.srd_classes(id),
  previous_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  hp_gained INTEGER NOT NULL,
  choices_made JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_character_level_history_char ON public.character_level_history(character_id, new_level DESC);

-- ==================== RLS POLICIES ====================

-- Class Features (public read)
ALTER TABLE public.class_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view class features" ON public.class_features FOR SELECT USING (true);

-- Subclass Features (public read)
ALTER TABLE public.subclass_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subclass features" ON public.subclass_features FOR SELECT USING (true);

-- Character Class Levels
ALTER TABLE public.character_class_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their character class levels" ON public.character_class_levels 
  FOR SELECT USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "DMs can view campaign character class levels" ON public.character_class_levels 
  FOR SELECT USING (
    character_id IN (
      SELECT c.id FROM characters c
      JOIN campaigns camp ON c.campaign_id = camp.id
      WHERE camp.dm_user_id = auth.uid()
    )
  );
CREATE POLICY "Users can manage their character class levels" ON public.character_class_levels 
  FOR ALL USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- Character Feature Choices
ALTER TABLE public.character_feature_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their feature choices" ON public.character_feature_choices 
  FOR SELECT USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "DMs can view campaign feature choices" ON public.character_feature_choices 
  FOR SELECT USING (
    character_id IN (
      SELECT c.id FROM characters c
      JOIN campaigns camp ON c.campaign_id = camp.id
      WHERE camp.dm_user_id = auth.uid()
    )
  );
CREATE POLICY "Users can manage their feature choices" ON public.character_feature_choices 
  FOR ALL USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- Character Resources
ALTER TABLE public.character_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their resources" ON public.character_resources 
  FOR SELECT USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "DMs can view campaign resources" ON public.character_resources 
  FOR SELECT USING (
    character_id IN (
      SELECT c.id FROM characters c
      JOIN campaigns camp ON c.campaign_id = camp.id
      WHERE camp.dm_user_id = auth.uid()
    )
  );
CREATE POLICY "Users can manage their resources" ON public.character_resources 
  FOR ALL USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Server can update resources" ON public.character_resources 
  FOR UPDATE USING (auth.role() = 'service_role');

-- Character Spells Known
ALTER TABLE public.character_spells_known ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their known spells" ON public.character_spells_known 
  FOR SELECT USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "DMs can view campaign known spells" ON public.character_spells_known 
  FOR SELECT USING (
    character_id IN (
      SELECT c.id FROM characters c
      JOIN campaigns camp ON c.campaign_id = camp.id
      WHERE camp.dm_user_id = auth.uid()
    )
  );
CREATE POLICY "Users can manage their known spells" ON public.character_spells_known 
  FOR ALL USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- Feats (public read)
ALTER TABLE public.feats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feats" ON public.feats FOR SELECT USING (true);

-- Character Level History (already exists, just add RLS if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'character_level_history'
  ) THEN
    ALTER TABLE public.character_level_history ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view their level history" ON public.character_level_history 
      FOR SELECT USING (
        character_id IN (
          SELECT id FROM characters WHERE user_id = auth.uid()
        )
      );
    CREATE POLICY "Users can manage their level history" ON public.character_level_history 
      FOR ALL USING (
        character_id IN (
          SELECT id FROM characters WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;