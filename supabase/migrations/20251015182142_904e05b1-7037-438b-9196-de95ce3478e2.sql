-- Phase 4: Action Economy & Short-Rest Resources

-- Add action economy tracking to characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS action_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bonus_action_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reaction_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS resources jsonb DEFAULT '{}'::jsonb;

-- Add comment explaining the resources field structure
COMMENT ON COLUMN public.characters.resources IS 'Flexible JSONB store for class resources like {"hit_dice": {"current": 5, "max": 5}, "ki_points": {"current": 3, "max": 5}, "sorcery_points": {"current": 2, "max": 3}}';
