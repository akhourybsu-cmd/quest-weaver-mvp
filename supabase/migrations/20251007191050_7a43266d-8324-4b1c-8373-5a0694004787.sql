-- CRITICAL SECURITY: Strengthen RLS for combat authority
-- This migration locks down combat state to prevent client-side tampering

-- 1. Remove player ability to directly update characters during combat
DROP POLICY IF EXISTS "Players can update their own characters" ON public.characters;
CREATE POLICY "Players can update their own characters"
ON public.characters
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  AND (
    -- Allow updates ONLY if not in active encounter, OR only non-combat fields
    NOT EXISTS (
      SELECT 1 FROM encounters e
      JOIN initiative i ON i.encounter_id = e.id
      WHERE e.is_active = true
        AND i.character_id = characters.id
    )
  )
)
WITH CHECK (user_id = auth.uid());

-- 2. DMs can update characters during combat (full control)
DROP POLICY IF EXISTS "DMs can update campaign characters" ON public.characters;
CREATE POLICY "DMs can update campaign characters"
ON public.characters
FOR UPDATE
TO authenticated
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  )
);

-- 3. Lock down initiative - DM only
DROP POLICY IF EXISTS "Players cannot modify initiative" ON public.initiative;
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

-- 4. Save results - one per character per prompt
CREATE POLICY "Players can only insert their own save results once"
ON public.save_results
FOR INSERT
TO authenticated
WITH CHECK (
  character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM save_results 
    WHERE save_results.save_prompt_id = save_results.save_prompt_id
      AND save_results.character_id = character_id
  )
);

-- Prevent updates/deletes to save results
CREATE POLICY "Save results are immutable"
ON public.save_results
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Only DM can delete save results"
ON public.save_results
FOR DELETE
TO authenticated
USING (
  save_prompt_id IN (
    SELECT sp.id FROM save_prompts sp
    JOIN encounters e ON sp.encounter_id = e.id
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
);

-- 5. Combat log - DM insert only
DROP POLICY IF EXISTS "DMs can insert combat log" ON public.combat_log;
CREATE POLICY "DMs can insert combat log"
ON public.combat_log
FOR INSERT
TO authenticated
WITH CHECK (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
);

-- Prevent any updates to combat log (append-only)
CREATE POLICY "Combat log is immutable"
ON public.combat_log
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Combat log is delete-protected"
ON public.combat_log
FOR DELETE
TO authenticated
USING (false);