-- Add initiative_bonus to characters table
ALTER TABLE public.characters
ADD COLUMN initiative_bonus integer NOT NULL DEFAULT 0;

-- Add composite indexes for performance on commonly joined tables
CREATE INDEX idx_initiative_encounter_character ON public.initiative(encounter_id, character_id);
CREATE INDEX idx_effects_encounter_character ON public.effects(encounter_id, character_id);
CREATE INDEX idx_effects_concentrating ON public.effects(concentrating_character_id) WHERE requires_concentration = true;
CREATE INDEX idx_save_results_prompt ON public.save_results(save_prompt_id);
CREATE INDEX idx_combat_log_encounter_round ON public.combat_log(encounter_id, round DESC);
CREATE INDEX idx_tokens_map_visible ON public.tokens(map_id) WHERE is_visible = true;
CREATE INDEX idx_player_presence_campaign ON public.player_presence(campaign_id) WHERE is_online = true;

-- Strengthen RLS policies: Ensure all character updates validate ownership
DROP POLICY IF EXISTS "Players can update their own characters" ON public.characters;
CREATE POLICY "Players can update their own characters"
ON public.characters
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Strengthen save_results to ensure players only insert for their own characters
DROP POLICY IF EXISTS "Players can insert their save results" ON public.save_results;
CREATE POLICY "Players can insert their save results"
ON public.save_results
FOR INSERT
TO authenticated
WITH CHECK (
  character_id IN (
    SELECT id FROM public.characters WHERE user_id = auth.uid()
  )
);

-- Add policy to prevent players from modifying initiative directly
CREATE POLICY "Players cannot modify initiative"
ON public.initiative
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Update the DM initiative policy to be more explicit
DROP POLICY IF EXISTS "DMs can manage initiative" ON public.initiative;
CREATE POLICY "DMs can manage initiative"
ON public.initiative
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