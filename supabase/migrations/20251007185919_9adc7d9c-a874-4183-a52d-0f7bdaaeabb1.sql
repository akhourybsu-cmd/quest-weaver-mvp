-- Sprint 2: Initiative tie-breaker support (fixed - no random in generated column)
ALTER TABLE public.initiative
ADD COLUMN dex_modifier integer DEFAULT 0,
ADD COLUMN passive_perception integer DEFAULT 10;

-- Sprint 3: Save prompt lifecycle
ALTER TABLE public.save_prompts
ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
ADD COLUMN expires_at timestamptz,
ADD COLUMN half_on_success boolean DEFAULT false,
ADD COLUMN advantage_mode text DEFAULT 'normal' CHECK (advantage_mode IN ('normal', 'advantage', 'disadvantage')),
ADD COLUMN target_scope text DEFAULT 'custom' CHECK (target_scope IN ('party', 'all', 'custom'));

-- Ensure unique saves per character per prompt
CREATE UNIQUE INDEX IF NOT EXISTS idx_save_results_unique ON public.save_results(save_prompt_id, character_id);

-- Sprint 4: Conditions table
CREATE TABLE public.character_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  condition text NOT NULL CHECK (condition IN (
    'blinded', 'charmed', 'deafened', 'frightened', 'grappled', 
    'incapacitated', 'invisible', 'paralyzed', 'petrified', 
    'poisoned', 'prone', 'restrained', 'stunned', 'unconscious',
    'exhaustion_1', 'exhaustion_2', 'exhaustion_3', 'exhaustion_4', 'exhaustion_5', 'exhaustion_6'
  )),
  ends_at_round integer,
  source_effect_id uuid REFERENCES public.effects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for conditions
ALTER TABLE public.character_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view conditions"
ON public.character_conditions
FOR SELECT
TO authenticated
USING (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid() 
    OR c.id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "DMs can manage conditions"
ON public.character_conditions
FOR ALL
TO authenticated
USING (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
)
WITH CHECK (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
);

-- Add indexes for conditions
CREATE INDEX idx_conditions_character ON public.character_conditions(character_id);
CREATE INDEX idx_conditions_encounter ON public.character_conditions(encounter_id);
CREATE INDEX idx_conditions_active ON public.character_conditions(encounter_id, ends_at_round) WHERE ends_at_round IS NOT NULL;

-- Add healing tracking to combat log
ALTER TABLE public.combat_log
ADD COLUMN IF NOT EXISTS amount integer;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for conditions
CREATE TRIGGER update_conditions_updated_at
BEFORE UPDATE ON public.character_conditions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();