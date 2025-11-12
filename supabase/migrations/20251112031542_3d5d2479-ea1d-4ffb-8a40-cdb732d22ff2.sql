-- Add constraint for valid session statuses (using DO block to check if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_session_status'
  ) THEN
    ALTER TABLE campaign_sessions 
    ADD CONSTRAINT valid_session_status 
    CHECK (status IN ('live', 'paused', 'ended'));
  END IF;
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_live_session 
ON campaigns(live_session_id) 
WHERE live_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_sessions_status 
ON campaign_sessions(campaign_id, status) 
WHERE status IN ('live', 'paused');