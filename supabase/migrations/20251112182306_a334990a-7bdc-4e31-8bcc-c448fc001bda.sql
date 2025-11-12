-- Add missing columns to encounters table for better encounter management
ALTER TABLE public.encounters
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'deadly'));