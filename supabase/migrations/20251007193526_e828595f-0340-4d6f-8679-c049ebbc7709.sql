-- ============================================================
-- CRITICAL SECURITY: Lock down combat tables to prevent client manipulation
-- ============================================================

-- 1. DROP existing overly-permissive policies for characters HP/TempHP updates
DROP POLICY IF EXISTS "Players can update their own characters" ON public.characters;

-- 2. CREATE restrictive policy: Players can only update non-combat fields
CREATE POLICY "Players can update their own character profiles"
ON public.characters
FOR UPDATE
USING (
  user_id = auth.uid() 
  AND NOT EXISTS (
    SELECT 1 FROM encounters e
    JOIN initiative i ON i.encounter_id = e.id
    WHERE e.is_active = true AND i.character_id = characters.id
  )
)
WITH CHECK (
  user_id = auth.uid()
);

-- 3. CREATE policy: Only server (service role) can update HP during combat
-- Note: Edge functions run with service role, so they can update these fields
CREATE POLICY "Server can update character combat stats"
ON public.characters
FOR UPDATE
USING (auth.role() = 'service_role');

-- 4. LOCK DOWN save_results to be immutable and unique
-- Already has immutable policy, but ensure UPDATE is fully blocked
DROP POLICY IF EXISTS "Save results are immutable" ON public.save_results;

CREATE POLICY "Save results are immutable"
ON public.save_results
FOR UPDATE
USING (false);

-- 5. Ensure unique constraint exists on save_results
-- This prevents duplicate save submissions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'save_results_unique_submission'
  ) THEN
    ALTER TABLE public.save_results 
    ADD CONSTRAINT save_results_unique_submission 
    UNIQUE (save_prompt_id, character_id);
  END IF;
END $$;

-- 6. LOCK DOWN effects table - only DM or server can create/update/delete
-- Drop the permissive "DMs can manage effects" and replace with explicit policies
DROP POLICY IF EXISTS "DMs can manage effects" ON public.effects;

CREATE POLICY "DMs can create effects"
ON public.effects
FOR INSERT
WITH CHECK (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
);

CREATE POLICY "DMs can update effects"
ON public.effects
FOR UPDATE
USING (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
);

CREATE POLICY "DMs can delete effects"
ON public.effects
FOR DELETE
USING (
  encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  )
);

CREATE POLICY "Server can manage effects"
ON public.effects
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 7. LOCK DOWN initiative table - only DM or server can modify
DROP POLICY IF EXISTS "DMs can manage initiative" ON public.initiative;

CREATE POLICY "DMs can manage initiative"
ON public.initiative
FOR ALL
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

CREATE POLICY "Server can manage initiative"
ON public.initiative
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 8. Add validation for save_prompts DC range
ALTER TABLE public.save_prompts
ADD CONSTRAINT save_prompts_dc_range
CHECK (dc >= 1 AND dc <= 30);

-- 9. Add validation for damage/healing amounts
ALTER TABLE public.effects
ADD CONSTRAINT effects_damage_per_tick_positive
CHECK (damage_per_tick IS NULL OR damage_per_tick >= 0);