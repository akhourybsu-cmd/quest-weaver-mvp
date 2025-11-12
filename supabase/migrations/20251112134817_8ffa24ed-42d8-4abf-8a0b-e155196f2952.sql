-- Add optional session metadata columns for better tracking
ALTER TABLE campaign_sessions ADD COLUMN IF NOT EXISTS paused_at timestamptz;
ALTER TABLE campaign_sessions ADD COLUMN IF NOT EXISTS paused_duration_seconds integer DEFAULT 0;
ALTER TABLE campaign_sessions ADD COLUMN IF NOT EXISTS player_attendance jsonb DEFAULT '[]'::jsonb;
ALTER TABLE campaign_sessions ADD COLUMN IF NOT EXISTS session_notes text;
ALTER TABLE campaign_sessions ADD COLUMN IF NOT EXISTS dm_notes text;