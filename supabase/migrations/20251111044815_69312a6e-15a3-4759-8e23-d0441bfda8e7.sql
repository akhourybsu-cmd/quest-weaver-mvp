-- Readied Actions Table
CREATE TABLE IF NOT EXISTS public.readied_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  monster_id UUID REFERENCES public.encounter_monsters(id) ON DELETE CASCADE,
  action_description TEXT NOT NULL,
  trigger_condition TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at_round INTEGER NOT NULL,
  
  CONSTRAINT readied_actions_one_combatant CHECK (
    (character_id IS NOT NULL AND monster_id IS NULL) OR
    (character_id IS NULL AND monster_id IS NOT NULL)
  )
);

CREATE INDEX idx_readied_actions_encounter ON public.readied_actions(encounter_id);
CREATE INDEX idx_readied_actions_character ON public.readied_actions(character_id) WHERE character_id IS NOT NULL;
CREATE INDEX idx_readied_actions_monster ON public.readied_actions(monster_id) WHERE monster_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.readied_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for readied_actions
CREATE POLICY "Users can view readied actions in their campaigns"
  ON public.readied_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM encounters e
      JOIN campaigns c ON c.id = e.campaign_id
      WHERE e.id = readied_actions.encounter_id
        AND is_campaign_member(c.id, auth.uid())
    )
  );

CREATE POLICY "DMs can manage readied actions"
  ON public.readied_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM encounters e
      JOIN campaigns c ON c.id = e.campaign_id
      WHERE e.id = readied_actions.encounter_id
        AND c.dm_user_id = auth.uid()
    )
  );

CREATE POLICY "Players can create their own readied actions"
  ON public.readied_actions FOR INSERT
  WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- Mount-Rider Pairs Table
CREATE TABLE IF NOT EXISTS public.mount_rider_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  rider_character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  rider_monster_id UUID REFERENCES public.encounter_monsters(id) ON DELETE CASCADE,
  mount_character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  mount_monster_id UUID REFERENCES public.encounter_monsters(id) ON DELETE CASCADE,
  is_controlled BOOLEAN DEFAULT true,
  mounted_at_round INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT mount_rider_one_rider CHECK (
    (rider_character_id IS NOT NULL AND rider_monster_id IS NULL) OR
    (rider_character_id IS NULL AND rider_monster_id IS NOT NULL)
  ),
  CONSTRAINT mount_rider_one_mount CHECK (
    (mount_character_id IS NOT NULL AND mount_monster_id IS NULL) OR
    (mount_character_id IS NULL AND mount_monster_id IS NOT NULL)
  )
);

CREATE INDEX idx_mount_rider_encounter ON public.mount_rider_pairs(encounter_id);
CREATE INDEX idx_mount_rider_rider_char ON public.mount_rider_pairs(rider_character_id) WHERE rider_character_id IS NOT NULL;
CREATE INDEX idx_mount_rider_mount_char ON public.mount_rider_pairs(mount_character_id) WHERE mount_character_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.mount_rider_pairs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mount_rider_pairs
CREATE POLICY "Users can view mount pairs in their campaigns"
  ON public.mount_rider_pairs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM encounters e
      JOIN campaigns c ON c.id = e.campaign_id
      WHERE e.id = mount_rider_pairs.encounter_id
        AND is_campaign_member(c.id, auth.uid())
    )
  );

CREATE POLICY "DMs can manage mount pairs"
  ON public.mount_rider_pairs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM encounters e
      JOIN campaigns c ON c.id = e.campaign_id
      WHERE e.id = mount_rider_pairs.encounter_id
        AND c.dm_user_id = auth.uid()
    )
  );

CREATE POLICY "Players can manage their own mount pairs"
  ON public.mount_rider_pairs FOR ALL
  USING (
    rider_character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );