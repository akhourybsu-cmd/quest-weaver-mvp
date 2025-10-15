-- Phase 2: Add death saves and inspiration to characters
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS death_save_success INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS death_save_fail INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inspiration BOOLEAN DEFAULT false;

-- Ensure temp_hp exists (may already be there)
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS temp_hp INTEGER DEFAULT 0;