-- Add 'scheduled' to the allowed campaign_sessions status values
ALTER TABLE campaign_sessions 
DROP CONSTRAINT IF EXISTS campaign_sessions_status_check;

ALTER TABLE campaign_sessions
ADD CONSTRAINT campaign_sessions_status_check 
CHECK (status IN ('scheduled', 'live', 'paused', 'ended'));