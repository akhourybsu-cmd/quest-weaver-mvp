-- Phase 5: Session Management & Player View

-- Add encounter status field for more granular state management
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'encounter_status') THEN
    CREATE TYPE encounter_status AS ENUM ('preparing', 'active', 'paused', 'ended');
  END IF;
END $$;

ALTER TABLE public.encounters
ADD COLUMN IF NOT EXISTS status encounter_status DEFAULT 'preparing';

-- Migrate existing encounters: is_active=true -> 'active', is_active=false -> 'preparing'
UPDATE public.encounters
SET status = CASE 
  WHEN is_active = true THEN 'active'::encounter_status
  ELSE 'preparing'::encounter_status
END
WHERE status IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_encounters_status ON public.encounters(status);
CREATE INDEX IF NOT EXISTS idx_player_presence_needs_ruling ON public.player_presence(needs_ruling) WHERE needs_ruling = true;
