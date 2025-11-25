-- Phase 1: Add session naming and prep fields to campaign_sessions
ALTER TABLE public.campaign_sessions 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS goals text,
ADD COLUMN IF NOT EXISTS prep_checklist jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.campaign_sessions.name IS 'Optional session name (falls back to date display if empty)';
COMMENT ON COLUMN public.campaign_sessions.goals IS 'Session objectives/goals text';
COMMENT ON COLUMN public.campaign_sessions.prep_checklist IS 'Array of {text: string, completed: boolean} prep items';