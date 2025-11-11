-- Create combat_modifiers table for advantage/disadvantage tracking
CREATE TABLE IF NOT EXISTS public.combat_modifiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'character' CHECK (actor_type IN ('character', 'monster')),
  modifier_type TEXT NOT NULL CHECK (modifier_type IN ('advantage', 'disadvantage', 'cover_half', 'cover_three_quarters', 'cover_full')),
  source TEXT NOT NULL,
  expires_at TEXT NOT NULL DEFAULT 'end_of_turn' CHECK (expires_at IN ('end_of_turn', 'end_of_round', 'start_of_turn', 'permanent', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.combat_modifiers ENABLE ROW LEVEL SECURITY;

-- Campaign members can view combat modifiers
CREATE POLICY "Campaign members can view combat modifiers"
  ON public.combat_modifiers FOR SELECT
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

-- DMs can manage combat modifiers
CREATE POLICY "DMs can manage combat modifiers"
  ON public.combat_modifiers FOR ALL
  USING (
    encounter_id IN (
      SELECT e.id FROM encounters e
      JOIN campaigns c ON e.campaign_id = c.id
      WHERE c.dm_user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX idx_combat_modifiers_encounter ON public.combat_modifiers(encounter_id);
CREATE INDEX idx_combat_modifiers_actor ON public.combat_modifiers(actor_id, actor_type);

-- Add critical hit tracking to combat_log
ALTER TABLE public.combat_log ADD COLUMN IF NOT EXISTS is_critical_hit BOOLEAN DEFAULT FALSE;