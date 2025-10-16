-- ============================================
-- PHASE A: SRD Content Tables
-- ============================================

-- Ancestries (Races in SRD)
CREATE TABLE IF NOT EXISTS srd_ancestries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  speed INTEGER NOT NULL DEFAULT 30,
  size TEXT NOT NULL CHECK (size IN ('Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan')),
  ability_bonuses JSONB NOT NULL DEFAULT '[]',
  traits JSONB NOT NULL DEFAULT '[]',
  languages JSONB NOT NULL DEFAULT '[]',
  proficiencies JSONB NOT NULL DEFAULT '[]',
  options JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subancestries (Subraces)
CREATE TABLE IF NOT EXISTS srd_subancestries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ancestry_id UUID NOT NULL REFERENCES srd_ancestries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  traits JSONB NOT NULL DEFAULT '[]',
  ability_bonuses JSONB NOT NULL DEFAULT '[]',
  options JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ancestry_id, name)
);

-- Backgrounds
CREATE TABLE IF NOT EXISTS srd_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  skill_proficiencies JSONB NOT NULL DEFAULT '[]',
  tool_proficiencies JSONB NOT NULL DEFAULT '[]',
  languages JSONB NOT NULL DEFAULT '[]',
  equipment JSONB NOT NULL DEFAULT '[]',
  feature TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Classes
CREATE TABLE IF NOT EXISTS srd_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  hit_die INTEGER NOT NULL,
  saving_throws TEXT[] NOT NULL DEFAULT '{}',
  proficiencies JSONB NOT NULL DEFAULT '{}',
  starting_equipment JSONB NOT NULL DEFAULT '[]',
  spellcasting_progression TEXT,
  spellcasting_ability TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subclasses
CREATE TABLE IF NOT EXISTS srd_subclasses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES srd_classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unlock_level INTEGER NOT NULL DEFAULT 3,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, name)
);

-- Class Features
CREATE TABLE IF NOT EXISTS srd_class_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES srd_classes(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 20),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  choices JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, level, name)
);

-- Subclass Features
CREATE TABLE IF NOT EXISTS srd_subclass_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subclass_id UUID NOT NULL REFERENCES srd_subclasses(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 20),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  choices JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subclass_id, level, name)
);

-- Spell Slots
CREATE TABLE IF NOT EXISTS srd_spell_slots (
  class_id UUID NOT NULL REFERENCES srd_classes(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 20),
  slot_array INTEGER[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (class_id, level)
);

-- Spells
CREATE TABLE IF NOT EXISTS srd_spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL CHECK (level BETWEEN 0 AND 9),
  school TEXT NOT NULL,
  classes TEXT[] NOT NULL DEFAULT '{}',
  casting_time TEXT NOT NULL,
  range TEXT NOT NULL,
  components TEXT[] NOT NULL DEFAULT '{}',
  material TEXT,
  duration TEXT NOT NULL,
  concentration BOOLEAN DEFAULT false,
  ritual BOOLEAN DEFAULT false,
  description TEXT NOT NULL,
  higher_levels TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment
CREATE TABLE IF NOT EXISTS srd_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  weight NUMERIC(10, 2) DEFAULT 0,
  cost_gp NUMERIC(10, 2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weapons
CREATE TABLE IF NOT EXISTS srd_weapons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('Simple Melee', 'Simple Ranged', 'Martial Melee', 'Martial Ranged')),
  damage TEXT NOT NULL,
  damage_type TEXT NOT NULL,
  properties TEXT[] DEFAULT '{}',
  weight NUMERIC(10, 2) DEFAULT 0,
  cost_gp NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Armor
CREATE TABLE IF NOT EXISTS srd_armor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('Light', 'Medium', 'Heavy', 'Shield')),
  base_ac INTEGER NOT NULL,
  dex_cap INTEGER,
  strength_min INTEGER DEFAULT 0,
  stealth_disadv BOOLEAN DEFAULT false,
  weight NUMERIC(10, 2) DEFAULT 0,
  cost_gp NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tools
CREATE TABLE IF NOT EXISTS srd_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  cost_gp NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Languages
CREATE TABLE IF NOT EXISTS srd_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  script TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Character Normalized Tables
-- ============================================

-- Update characters table with new fields
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS ancestry_id UUID REFERENCES srd_ancestries(id),
ADD COLUMN IF NOT EXISTS subancestry_id UUID REFERENCES srd_subancestries(id),
ADD COLUMN IF NOT EXISTS background_id UUID REFERENCES srd_backgrounds(id),
ADD COLUMN IF NOT EXISTS subclass_id UUID REFERENCES srd_subclasses(id),
ADD COLUMN IF NOT EXISTS alignment TEXT,
ADD COLUMN IF NOT EXISTS age TEXT,
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS eyes TEXT,
ADD COLUMN IF NOT EXISTS skin TEXT,
ADD COLUMN IF NOT EXISTS hair TEXT,
ADD COLUMN IF NOT EXISTS size TEXT DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS hit_die TEXT DEFAULT 'd8',
ADD COLUMN IF NOT EXISTS hit_dice_total INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS hit_dice_current INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS spell_ability TEXT,
ADD COLUMN IF NOT EXISTS spell_save_dc INTEGER,
ADD COLUMN IF NOT EXISTS spell_attack_mod INTEGER,
ADD COLUMN IF NOT EXISTS portrait_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'retired'));

-- Character Abilities
CREATE TABLE IF NOT EXISTS character_abilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  str INTEGER NOT NULL DEFAULT 10 CHECK (str BETWEEN 1 AND 30),
  dex INTEGER NOT NULL DEFAULT 10 CHECK (dex BETWEEN 1 AND 30),
  con INTEGER NOT NULL DEFAULT 10 CHECK (con BETWEEN 1 AND 30),
  int INTEGER NOT NULL DEFAULT 10 CHECK (int BETWEEN 1 AND 30),
  wis INTEGER NOT NULL DEFAULT 10 CHECK (wis BETWEEN 1 AND 30),
  cha INTEGER NOT NULL DEFAULT 10 CHECK (cha BETWEEN 1 AND 30),
  method TEXT NOT NULL DEFAULT 'standard-array' CHECK (method IN ('standard-array', 'point-buy', 'rolled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id)
);

-- Character Saves
CREATE TABLE IF NOT EXISTS character_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  str BOOLEAN DEFAULT false,
  dex BOOLEAN DEFAULT false,
  con BOOLEAN DEFAULT false,
  int BOOLEAN DEFAULT false,
  wis BOOLEAN DEFAULT false,
  cha BOOLEAN DEFAULT false,
  UNIQUE(character_id)
);

-- Character Skills
CREATE TABLE IF NOT EXISTS character_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  proficient BOOLEAN DEFAULT false,
  expertise BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, skill)
);

-- Character Proficiencies
CREATE TABLE IF NOT EXISTS character_proficiencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('armor', 'weapon', 'tool')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, type, name)
);

-- Character Languages
CREATE TABLE IF NOT EXISTS character_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, name)
);

-- Character Features
CREATE TABLE IF NOT EXISTS character_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Character Equipment
CREATE TABLE IF NOT EXISTS character_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_ref TEXT NOT NULL,
  qty INTEGER DEFAULT 1,
  equipped BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Character Attacks
CREATE TABLE IF NOT EXISTS character_attacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ability TEXT NOT NULL,
  attack_bonus INTEGER NOT NULL,
  damage TEXT NOT NULL,
  damage_type TEXT,
  properties TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Character Spells
CREATE TABLE IF NOT EXISTS character_spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  spell_id UUID NOT NULL REFERENCES srd_spells(id) ON DELETE CASCADE,
  known BOOLEAN DEFAULT false,
  prepared BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'class',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(character_id, spell_id)
);

-- ============================================
-- RLS Policies
-- ============================================

-- SRD tables are read-only to all authenticated users
ALTER TABLE srd_ancestries ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_subancestries ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_subclasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_class_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_subclass_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_spell_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_armor ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view SRD ancestries" ON srd_ancestries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD subancestries" ON srd_subancestries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD backgrounds" ON srd_backgrounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD classes" ON srd_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD subclasses" ON srd_subclasses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD class features" ON srd_class_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD subclass features" ON srd_subclass_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD spell slots" ON srd_spell_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD spells" ON srd_spells FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD equipment" ON srd_equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD weapons" ON srd_weapons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD armor" ON srd_armor FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD tools" ON srd_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view SRD languages" ON srd_languages FOR SELECT TO authenticated USING (true);

-- Character normalized tables
ALTER TABLE character_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_proficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_attacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_spells ENABLE ROW LEVEL SECURITY;

-- Character abilities policies
CREATE POLICY "Users can view their character abilities" ON character_abilities FOR SELECT 
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their character abilities" ON character_abilities FOR ALL
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "DMs can view campaign character abilities" ON character_abilities FOR SELECT
USING (character_id IN (SELECT c.id FROM characters c JOIN campaigns camp ON c.campaign_id = camp.id WHERE camp.dm_user_id = auth.uid()));

-- Character saves policies
CREATE POLICY "Users can view their character saves" ON character_saves FOR SELECT
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their character saves" ON character_saves FOR ALL
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "DMs can view campaign character saves" ON character_saves FOR SELECT
USING (character_id IN (SELECT c.id FROM characters c JOIN campaigns camp ON c.campaign_id = camp.id WHERE camp.dm_user_id = auth.uid()));

-- Character skills policies
CREATE POLICY "Users can view their character skills" ON character_skills FOR SELECT
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their character skills" ON character_skills FOR ALL
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "DMs can view campaign character skills" ON character_skills FOR SELECT
USING (character_id IN (SELECT c.id FROM characters c JOIN campaigns camp ON c.campaign_id = camp.id WHERE camp.dm_user_id = auth.uid()));

-- Character proficiencies policies
CREATE POLICY "Users can view their character proficiencies" ON character_proficiencies FOR SELECT
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their character proficiencies" ON character_proficiencies FOR ALL
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "DMs can view campaign character proficiencies" ON character_proficiencies FOR SELECT
USING (character_id IN (SELECT c.id FROM characters c JOIN campaigns camp ON c.campaign_id = camp.id WHERE camp.dm_user_id = auth.uid()));

-- Character languages policies
CREATE POLICY "Users can view their character languages" ON character_languages FOR SELECT
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their character languages" ON character_languages FOR ALL
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "DMs can view campaign character languages" ON character_languages FOR SELECT
USING (character_id IN (SELECT c.id FROM characters c JOIN campaigns camp ON c.campaign_id = camp.id WHERE camp.dm_user_id = auth.uid()));

-- Character features policies
CREATE POLICY "Users can view their character features" ON character_features FOR SELECT
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their character features" ON character_features FOR ALL
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "DMs can view campaign character features" ON character_features FOR SELECT
USING (character_id IN (SELECT c.id FROM characters c JOIN campaigns camp ON c.campaign_id = camp.id WHERE camp.dm_user_id = auth.uid()));

-- Character equipment policies
CREATE POLICY "Users can view their character equipment" ON character_equipment FOR SELECT
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their character equipment" ON character_equipment FOR ALL
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "DMs can view campaign character equipment" ON character_equipment FOR SELECT
USING (character_id IN (SELECT c.id FROM characters c JOIN campaigns camp ON c.campaign_id = camp.id WHERE camp.dm_user_id = auth.uid()));

-- Character attacks policies
CREATE POLICY "Users can view their character attacks" ON character_attacks FOR SELECT
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their character attacks" ON character_attacks FOR ALL
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "DMs can view campaign character attacks" ON character_attacks FOR SELECT
USING (character_id IN (SELECT c.id FROM characters c JOIN campaigns camp ON c.campaign_id = camp.id WHERE camp.dm_user_id = auth.uid()));

-- Character spells policies
CREATE POLICY "Users can view their character spells" ON character_spells FOR SELECT
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their character spells" ON character_spells FOR ALL
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "DMs can view campaign character spells" ON character_spells FOR SELECT
USING (character_id IN (SELECT c.id FROM characters c JOIN campaigns camp ON c.campaign_id = camp.id WHERE camp.dm_user_id = auth.uid()));