-- Add spell_save_dc_summary field to monster_catalog
ALTER TABLE monster_catalog 
ADD COLUMN spell_save_dc_summary jsonb DEFAULT '[]'::jsonb;