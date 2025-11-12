-- Add details column to locations table for storing additional location attributes
ALTER TABLE locations ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb;