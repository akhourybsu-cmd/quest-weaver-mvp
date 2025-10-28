-- Add new columns to quests table for comprehensive quest management

-- Quest metadata
ALTER TABLE public.quests
ADD COLUMN quest_type text DEFAULT 'main_quest',
ADD COLUMN status text DEFAULT 'not_started',
ADD COLUMN locations text[] DEFAULT '{}',
ADD COLUMN difficulty text,
ADD COLUMN tags text[] DEFAULT '{}',
ADD COLUMN faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL;

-- Quest rewards
ALTER TABLE public.quests
ADD COLUMN reward_xp integer DEFAULT 0,
ADD COLUMN reward_gp numeric DEFAULT 0,
ADD COLUMN reward_items jsonb DEFAULT '[]',
ADD COLUMN assigned_to uuid[] DEFAULT '{}';

-- DM tools
ALTER TABLE public.quests
ADD COLUMN dm_notes text,
ADD COLUMN session_notes text,
ADD COLUMN quest_chain_parent uuid REFERENCES public.quests(id) ON DELETE SET NULL;

-- Enhance quest_steps table
ALTER TABLE public.quest_steps
ADD COLUMN objective_type text DEFAULT 'other',
ADD COLUMN progress_current integer DEFAULT 0,
ADD COLUMN progress_max integer DEFAULT 1,
ADD COLUMN parent_step_id uuid REFERENCES public.quest_steps(id) ON DELETE CASCADE,
ADD COLUMN notes text,
ADD COLUMN encounter_id uuid REFERENCES public.encounters(id) ON DELETE SET NULL,
ADD COLUMN npc_id uuid REFERENCES public.npcs(id) ON DELETE SET NULL,
ADD COLUMN location text;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_quests_campaign_status ON public.quests(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_quests_faction ON public.quests(faction_id);
CREATE INDEX IF NOT EXISTS idx_quest_steps_parent ON public.quest_steps(parent_step_id);
CREATE INDEX IF NOT EXISTS idx_quest_steps_encounter ON public.quest_steps(encounter_id);

-- Add check constraints for valid values
ALTER TABLE public.quests
ADD CONSTRAINT valid_quest_type CHECK (quest_type IN ('main_quest', 'side_quest', 'faction', 'personal', 'miscellaneous')),
ADD CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
ADD CONSTRAINT valid_difficulty CHECK (difficulty IS NULL OR difficulty IN ('easy', 'moderate', 'hard', 'deadly'));

ALTER TABLE public.quest_steps
ADD CONSTRAINT valid_objective_type CHECK (objective_type IN ('exploration', 'combat', 'fetch', 'escort', 'puzzle', 'social', 'other')),
ADD CONSTRAINT valid_progress CHECK (progress_current >= 0 AND progress_current <= progress_max);

-- Create function to auto-update quest status based on steps
CREATE OR REPLACE FUNCTION update_quest_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.quests
  SET status = CASE
    WHEN EXISTS (
      SELECT 1 FROM public.quest_steps
      WHERE quest_id = NEW.quest_id AND is_completed = false
    ) THEN 'in_progress'
    WHEN NOT EXISTS (
      SELECT 1 FROM public.quest_steps
      WHERE quest_id = NEW.quest_id AND is_completed = false
    ) THEN 'completed'
    ELSE status
  END,
  updated_at = now()
  WHERE id = NEW.quest_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-status updates
DROP TRIGGER IF EXISTS trigger_update_quest_status ON public.quest_steps;
CREATE TRIGGER trigger_update_quest_status
AFTER UPDATE OF is_completed ON public.quest_steps
FOR EACH ROW
EXECUTE FUNCTION update_quest_status();