-- Add combatant_type to initiative table to support both characters and monsters
ALTER TABLE public.initiative ADD COLUMN combatant_type TEXT NOT NULL DEFAULT 'character';

-- Create index for faster queries
CREATE INDEX idx_initiative_combatant ON public.initiative(encounter_id, combatant_type, character_id);

-- Update RLS policies to handle both types
DROP POLICY IF EXISTS "Campaign members can view initiative" ON public.initiative;
DROP POLICY IF EXISTS "DMs can manage initiative" ON public.initiative;

CREATE POLICY "Campaign members can view initiative"
ON public.initiative FOR SELECT
USING (
  encounter_id IN (
    SELECT encounters.id
    FROM encounters
    WHERE encounters.campaign_id IN (
      SELECT campaigns.id
      FROM campaigns
      WHERE campaigns.dm_user_id = auth.uid()
      OR campaigns.id IN (
        SELECT characters.campaign_id
        FROM characters
        WHERE characters.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "DMs can manage initiative"
ON public.initiative FOR ALL
USING (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
);