-- Add spell scaling information to SRD spells table
ALTER TABLE public.srd_spells ADD COLUMN IF NOT EXISTS scaling_type TEXT CHECK (scaling_type IN ('per_slot', 'per_two_slots', 'fixed_increase', 'none'));
ALTER TABLE public.srd_spells ADD COLUMN IF NOT EXISTS scaling_value TEXT; -- e.g., '+1d8', '+1 target', '+1 hour'
ALTER TABLE public.srd_spells ADD COLUMN IF NOT EXISTS scaling_description TEXT;

-- Add to custom spells too
ALTER TABLE public.custom_spells ADD COLUMN IF NOT EXISTS scaling_type TEXT CHECK (scaling_type IN ('per_slot', 'per_two_slots', 'fixed_increase', 'none'));
ALTER TABLE public.custom_spells ADD COLUMN IF NOT EXISTS scaling_value TEXT;
ALTER TABLE public.custom_spells ADD COLUMN IF NOT EXISTS scaling_description TEXT;

-- Enable realtime for spell slots
ALTER TABLE public.character_spell_slots REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.character_spell_slots;