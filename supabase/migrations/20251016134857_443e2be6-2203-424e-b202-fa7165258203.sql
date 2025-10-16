-- Add status column to characters table to track creation completion
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS creation_status TEXT DEFAULT 'complete' CHECK (creation_status IN ('draft', 'complete'));

-- Add comment explaining the column
COMMENT ON COLUMN characters.creation_status IS 'Tracks whether character creation is complete (complete) or still in progress (draft)';

-- Update existing characters to be complete
UPDATE characters SET creation_status = 'complete' WHERE creation_status IS NULL;