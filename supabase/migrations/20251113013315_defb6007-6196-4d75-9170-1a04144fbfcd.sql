-- Update the valid_session_status constraint to include 'scheduled'
ALTER TABLE campaign_sessions 
DROP CONSTRAINT IF EXISTS valid_session_status;

ALTER TABLE campaign_sessions
ADD CONSTRAINT valid_session_status 
CHECK (status IN ('scheduled', 'live', 'paused', 'ended'));