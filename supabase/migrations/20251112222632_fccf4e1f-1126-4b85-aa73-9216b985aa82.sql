-- Add new columns to npcs table for enhanced directory features
ALTER TABLE npcs 
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'alive' CHECK (status IN ('alive', 'dead', 'missing', 'unknown')),
  ADD COLUMN IF NOT EXISTS alignment TEXT,
  ADD COLUMN IF NOT EXISTS first_appearance_session_id UUID REFERENCES campaign_sessions(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_npcs_pinned ON npcs(campaign_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_npcs_status ON npcs(campaign_id, status);

-- Add comment for documentation
COMMENT ON COLUMN npcs.is_pinned IS 'DM can pin important NPCs for quick access';
COMMENT ON COLUMN npcs.status IS 'Track if NPC is alive, dead, missing, or unknown';
COMMENT ON COLUMN npcs.alignment IS 'Moral and ethical alignment (e.g., Lawful Good)';
COMMENT ON COLUMN npcs.first_appearance_session_id IS 'Session where this NPC first appeared';