-- ============================================================
-- SPRINT A: Prompt Auto-Resolve - Using temp column strategy
-- ============================================================

-- 1. Create ENUMs
CREATE TYPE public.save_prompt_status AS ENUM ('active', 'resolved', 'expired');
CREATE TYPE public.advantage_mode_enum AS ENUM ('normal', 'advantage', 'disadvantage');
CREATE TYPE public.target_scope_enum AS ENUM ('party', 'all', 'custom');

-- 2. Add tracking columns
ALTER TABLE public.save_prompts ADD COLUMN IF NOT EXISTS expected_responses integer;
ALTER TABLE public.save_prompts ADD COLUMN IF NOT EXISTS received_responses integer DEFAULT 0;

-- 3. Add temp ENUM columns
ALTER TABLE public.save_prompts ADD COLUMN status_new save_prompt_status;
ALTER TABLE public.save_prompts ADD COLUMN advantage_mode_new advantage_mode_enum;
ALTER TABLE public.save_prompts ADD COLUMN target_scope_new target_scope_enum;

-- 4. Copy data with COALESCE for safety
UPDATE public.save_prompts SET status_new = COALESCE(status::save_prompt_status, 'active'::save_prompt_status);
UPDATE public.save_prompts SET advantage_mode_new = COALESCE(advantage_mode::advantage_mode_enum, 'normal'::advantage_mode_enum);
UPDATE public.save_prompts SET target_scope_new = COALESCE(target_scope::target_scope_enum, 'party'::target_scope_enum);

-- 5. Drop old columns and rename new ones
ALTER TABLE public.save_prompts DROP COLUMN status;
ALTER TABLE public.save_prompts DROP COLUMN advantage_mode;
ALTER TABLE public.save_prompts DROP COLUMN target_scope;

ALTER TABLE public.save_prompts RENAME COLUMN status_new TO status;
ALTER TABLE public.save_prompts RENAME COLUMN advantage_mode_new TO advantage_mode;
ALTER TABLE public.save_prompts RENAME COLUMN target_scope_new TO target_scope;

-- 6. Add constraints and defaults
ALTER TABLE public.save_prompts ALTER COLUMN status SET DEFAULT 'active'::save_prompt_status;
ALTER TABLE public.save_prompts ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.save_prompts ALTER COLUMN advantage_mode SET DEFAULT 'normal'::advantage_mode_enum;
ALTER TABLE public.save_prompts ALTER COLUMN advantage_mode SET NOT NULL;
ALTER TABLE public.save_prompts ALTER COLUMN target_scope SET DEFAULT 'party'::target_scope_enum;
ALTER TABLE public.save_prompts ALTER COLUMN target_scope SET NOT NULL;

-- 7. Helper function
CREATE OR REPLACE FUNCTION public.compute_save_prompt_targets(_encounter_id uuid, _target_scope target_scope_enum, _target_character_ids uuid[])
RETURNS uuid[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE target_ids uuid[];
BEGIN
  IF _target_scope = 'custom' THEN RETURN _target_character_ids; END IF;
  SELECT ARRAY_AGG(DISTINCT i.character_id) INTO target_ids FROM initiative i JOIN characters c ON c.id = i.character_id WHERE i.encounter_id = _encounter_id AND (_target_scope = 'all' OR c.user_id IS NOT NULL);
  RETURN COALESCE(target_ids, ARRAY[]::uuid[]);
END; $$;

-- 8. Auto-resolve trigger
CREATE OR REPLACE FUNCTION public.increment_save_prompt_responses() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prompt_expected integer; prompt_received integer; current_status save_prompt_status;
BEGIN
  UPDATE save_prompts SET received_responses = received_responses + 1 WHERE id = NEW.save_prompt_id RETURNING expected_responses, received_responses + 1, status INTO prompt_expected, prompt_received, current_status;
  IF prompt_received >= prompt_expected AND current_status = 'active' THEN UPDATE save_prompts SET status = 'resolved' WHERE id = NEW.save_prompt_id; END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER auto_resolve_save_prompt AFTER INSERT ON public.save_results FOR EACH ROW EXECUTE FUNCTION public.increment_save_prompt_responses();

-- 9. Index
CREATE INDEX idx_save_prompts_status_encounter ON public.save_prompts(encounter_id, status);