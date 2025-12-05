-- Add goals column to factions table
ALTER TABLE factions ADD COLUMN IF NOT EXISTS goals text[] DEFAULT '{}';