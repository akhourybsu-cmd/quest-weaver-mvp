-- Add RLS policies to prevent player tampering of combat state

-- Characters: Only server can update HP/TempHP during combat
CREATE POLICY "Only server can update combat HP"
ON public.characters
FOR UPDATE
USING (auth.role() = 'service_role');

-- Initiative: Only DM/server can manage
CREATE POLICY "Players cannot update initiative"
ON public.initiative
FOR UPDATE
USING (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "Players cannot delete initiative"
ON public.initiative
FOR DELETE
USING (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "Players cannot insert initiative"
ON public.initiative
FOR INSERT
WITH CHECK (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
  OR auth.role() = 'service_role'
);

-- Effects: Only DM/server can manage
CREATE POLICY "Players cannot update effects"
ON public.effects
FOR UPDATE
USING (false);

CREATE POLICY "Players cannot insert effects"
ON public.effects
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Players cannot delete effects"
ON public.effects
FOR DELETE
USING (false);

-- Character Conditions: Only DM/server can manage
CREATE POLICY "Players cannot update conditions"
ON public.character_conditions
FOR UPDATE
USING (false);

CREATE POLICY "Players cannot insert conditions"
ON public.character_conditions
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Players cannot delete conditions"
ON public.character_conditions
FOR DELETE
USING (false);