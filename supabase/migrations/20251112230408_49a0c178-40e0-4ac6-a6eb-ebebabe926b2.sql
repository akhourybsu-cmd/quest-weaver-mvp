-- Phase 2: Add pack metadata fields to all session junction tables
ALTER TABLE session_quests ADD COLUMN IF NOT EXISTS
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','skipped','blocked')),
ADD COLUMN IF NOT EXISTS planned_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'mid',
ADD COLUMN IF NOT EXISTS gm_notes TEXT,
ADD COLUMN IF NOT EXISTS player_share BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_duration_min INT;

ALTER TABLE session_encounters ADD COLUMN IF NOT EXISTS
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','skipped','blocked')),
ADD COLUMN IF NOT EXISTS planned_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'mid',
ADD COLUMN IF NOT EXISTS gm_notes TEXT,
ADD COLUMN IF NOT EXISTS player_share BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_duration_min INT;

ALTER TABLE session_npcs ADD COLUMN IF NOT EXISTS
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','skipped','blocked')),
ADD COLUMN IF NOT EXISTS planned_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'mid',
ADD COLUMN IF NOT EXISTS gm_notes TEXT,
ADD COLUMN IF NOT EXISTS player_share BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_duration_min INT;

ALTER TABLE session_handouts ADD COLUMN IF NOT EXISTS
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','skipped','blocked')),
ADD COLUMN IF NOT EXISTS planned_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'mid',
ADD COLUMN IF NOT EXISTS gm_notes TEXT,
ADD COLUMN IF NOT EXISTS player_share BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_duration_min INT;

ALTER TABLE session_locations ADD COLUMN IF NOT EXISTS
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','skipped','blocked')),
ADD COLUMN IF NOT EXISTS planned_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'mid',
ADD COLUMN IF NOT EXISTS gm_notes TEXT,
ADD COLUMN IF NOT EXISTS player_share BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_duration_min INT;

-- Phase 1: Create session_items table for Item Vault integration
CREATE TABLE IF NOT EXISTS session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES campaign_sessions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','skipped','blocked')),
  planned_order INT DEFAULT 0,
  section TEXT DEFAULT 'mid',
  gm_notes TEXT,
  player_share BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expected_duration_min INT,
  distributed BOOLEAN DEFAULT false,
  notes TEXT
);

-- Enable RLS on session_items
ALTER TABLE session_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_items
CREATE POLICY "Campaign members can view session items"
ON session_items FOR SELECT
USING (
  session_id IN (
    SELECT cs.id FROM campaign_sessions cs
    JOIN campaigns c ON c.id = cs.campaign_id
    WHERE c.dm_user_id = auth.uid() OR is_campaign_member(c.id, auth.uid())
  )
);

CREATE POLICY "DMs can manage session items"
ON session_items FOR ALL
USING (
  session_id IN (
    SELECT cs.id FROM campaign_sessions cs
    JOIN campaigns c ON c.id = cs.campaign_id
    WHERE c.dm_user_id = auth.uid()
  )
);

-- Phase 4: Create session_log table for event tracking
CREATE TABLE IF NOT EXISTS session_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES campaign_sessions(id) ON DELETE CASCADE,
  card_id UUID,
  card_type TEXT,
  event TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on session_log
ALTER TABLE session_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_log
CREATE POLICY "Campaign members can view session logs"
ON session_log FOR SELECT
USING (
  session_id IN (
    SELECT cs.id FROM campaign_sessions cs
    JOIN campaigns c ON c.id = cs.campaign_id
    WHERE c.dm_user_id = auth.uid() OR is_campaign_member(c.id, auth.uid())
  )
);

CREATE POLICY "DMs can manage session logs"
ON session_log FOR ALL
USING (
  session_id IN (
    SELECT cs.id FROM campaign_sessions cs
    JOIN campaigns c ON c.id = cs.campaign_id
    WHERE c.dm_user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_items_session_id ON session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_session_items_item_id ON session_items(item_id);
CREATE INDEX IF NOT EXISTS idx_session_log_session_id ON session_log(session_id);
CREATE INDEX IF NOT EXISTS idx_session_log_created_at ON session_log(created_at DESC);