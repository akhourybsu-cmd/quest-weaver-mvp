-- Create enum for monster sizes
CREATE TYPE monster_size AS ENUM ('tiny', 'small', 'medium', 'large', 'huge', 'gargantuan');

-- Create enum for source types
CREATE TYPE monster_source_type AS ENUM ('catalog', 'homebrew');

-- Monster catalog table (read-only SRD)
CREATE TABLE public.monster_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'SRD 5.1',
  type TEXT NOT NULL,
  size monster_size NOT NULL,
  alignment TEXT,
  cr NUMERIC(4,2),
  ac INTEGER NOT NULL,
  hp_avg INTEGER NOT NULL,
  hp_formula TEXT,
  speed JSONB NOT NULL DEFAULT '{}',
  abilities JSONB NOT NULL DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
  saves JSONB DEFAULT '{}',
  skills JSONB DEFAULT '{}',
  senses JSONB DEFAULT '{}',
  languages TEXT,
  immunities JSONB DEFAULT '[]',
  resistances JSONB DEFAULT '[]',
  vulnerabilities JSONB DEFAULT '[]',
  traits JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  legendary_actions JSONB DEFAULT '[]',
  lair_actions JSONB DEFAULT '[]',
  proficiency_bonus INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_monster_catalog_name ON public.monster_catalog(name);
CREATE INDEX idx_monster_catalog_cr ON public.monster_catalog(cr);
CREATE INDEX idx_monster_catalog_type ON public.monster_catalog(type);

-- Monster homebrew table (DM/campaign owned)
CREATE TABLE public.monster_homebrew (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size monster_size NOT NULL,
  alignment TEXT,
  cr NUMERIC(4,2),
  ac INTEGER NOT NULL,
  hp_avg INTEGER NOT NULL,
  hp_formula TEXT,
  speed JSONB NOT NULL DEFAULT '{}',
  abilities JSONB NOT NULL DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
  saves JSONB DEFAULT '{}',
  skills JSONB DEFAULT '{}',
  senses JSONB DEFAULT '{}',
  languages TEXT,
  immunities JSONB DEFAULT '[]',
  resistances JSONB DEFAULT '[]',
  vulnerabilities JSONB DEFAULT '[]',
  traits JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  legendary_actions JSONB DEFAULT '[]',
  lair_actions JSONB DEFAULT '[]',
  proficiency_bonus INTEGER NOT NULL DEFAULT 2,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_monster_homebrew_campaign ON public.monster_homebrew(campaign_id);
CREATE INDEX idx_monster_homebrew_owner ON public.monster_homebrew(owner_user_id);

-- Encounter monsters table (snapshot of monsters in combat)
CREATE TABLE public.encounter_monsters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE CASCADE NOT NULL,
  source_type monster_source_type NOT NULL,
  source_monster_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  group_key TEXT NOT NULL,
  
  -- Snapshot stats
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size monster_size NOT NULL,
  ac INTEGER NOT NULL,
  hp_current INTEGER NOT NULL,
  hp_max INTEGER NOT NULL,
  speed JSONB NOT NULL DEFAULT '{}',
  abilities JSONB NOT NULL,
  saves JSONB DEFAULT '{}',
  skills JSONB DEFAULT '{}',
  senses JSONB DEFAULT '{}',
  languages TEXT,
  resistances JSONB DEFAULT '[]',
  immunities JSONB DEFAULT '[]',
  vulnerabilities JSONB DEFAULT '[]',
  traits JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  legendary_actions JSONB DEFAULT '[]',
  
  -- Combat tracking
  initiative INTEGER NOT NULL DEFAULT 0,
  initiative_bonus INTEGER NOT NULL DEFAULT 0,
  order_tiebreak INTEGER NOT NULL DEFAULT 0,
  is_current_turn BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_encounter_monsters_encounter ON public.encounter_monsters(encounter_id);
CREATE INDEX idx_encounter_monsters_group ON public.encounter_monsters(encounter_id, group_key);

-- Enable RLS
ALTER TABLE public.monster_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monster_homebrew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounter_monsters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monster_catalog (read-only for all authenticated users)
CREATE POLICY "Anyone can view monster catalog"
ON public.monster_catalog FOR SELECT
USING (true);

-- RLS Policies for monster_homebrew
CREATE POLICY "Campaign members can view published homebrew"
ON public.monster_homebrew FOR SELECT
USING (
  is_published = true 
  AND (
    campaign_id IN (
      SELECT id FROM campaigns 
      WHERE dm_user_id = auth.uid() 
      OR id IN (SELECT campaign_id FROM characters WHERE user_id = auth.uid())
    )
    OR owner_user_id = auth.uid()
  )
);

CREATE POLICY "Owners can view their homebrew"
ON public.monster_homebrew FOR SELECT
USING (owner_user_id = auth.uid());

CREATE POLICY "Owners can manage their homebrew"
ON public.monster_homebrew FOR ALL
USING (owner_user_id = auth.uid());

-- RLS Policies for encounter_monsters
CREATE POLICY "Campaign members can view encounter monsters"
ON public.encounter_monsters FOR SELECT
USING (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid() 
    OR c.id IN (SELECT campaign_id FROM characters WHERE user_id = auth.uid())
  )
);

CREATE POLICY "DMs can manage encounter monsters"
ON public.encounter_monsters FOR ALL
USING (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_monster_catalog_updated_at
BEFORE UPDATE ON public.monster_catalog
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_monster_homebrew_updated_at
BEFORE UPDATE ON public.monster_homebrew
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_encounter_monsters_updated_at
BEFORE UPDATE ON public.encounter_monsters
FOR EACH ROW EXECUTE FUNCTION update_updated_at();