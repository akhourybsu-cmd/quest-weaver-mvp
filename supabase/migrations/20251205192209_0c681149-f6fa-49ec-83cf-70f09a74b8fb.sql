-- Fix SECURITY DEFINER functions missing search_path
-- This prevents search_path manipulation attacks

CREATE OR REPLACE FUNCTION public.reset_spell_slots(char_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.character_spell_slots
  SET used_slots = 0
  WHERE character_id = char_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_players_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_prepared_spell_count(char_id uuid)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.character_spells
  WHERE character_id = char_id AND prepared = true;
$function$;

CREATE OR REPLACE FUNCTION public.reset_turn_state()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Reset turn-based flags when turn advances
  UPDATE initiative 
  SET 
    has_leveled_spell_this_turn = false,
    leveled_spell_was_bonus_action = false
  WHERE encounter_id = NEW.encounter_id 
    AND id != NEW.id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_quest_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;