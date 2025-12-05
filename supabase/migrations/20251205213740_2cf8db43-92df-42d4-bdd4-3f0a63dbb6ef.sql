-- Add sort_direction column to campaign_eras table
ALTER TABLE campaign_eras 
ADD COLUMN sort_direction text NOT NULL DEFAULT 'asc';

-- Add check constraint to ensure valid values
ALTER TABLE campaign_eras
ADD CONSTRAINT campaign_eras_sort_direction_check 
CHECK (sort_direction IN ('asc', 'desc'));