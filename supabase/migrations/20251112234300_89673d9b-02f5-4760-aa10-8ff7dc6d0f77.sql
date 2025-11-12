-- Create session_pack_notes junction table
CREATE TABLE session_pack_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES campaign_sessions(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES session_notes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','skipped','blocked')),
  planned_order INT DEFAULT 0,
  section TEXT DEFAULT 'mid',
  gm_notes TEXT,
  player_share BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expected_duration_min INT,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, note_id)
);

-- Enable RLS
ALTER TABLE session_pack_notes ENABLE ROW LEVEL SECURITY;

-- Campaign members can view session pack notes
CREATE POLICY "Campaign members can view session pack notes"
  ON session_pack_notes FOR SELECT
  USING (
    session_id IN (
      SELECT cs.id FROM campaign_sessions cs
      JOIN campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid() OR is_campaign_member(c.id, auth.uid())
    )
  );

-- DMs can manage session pack notes
CREATE POLICY "DMs can manage session pack notes"
  ON session_pack_notes FOR ALL
  USING (
    session_id IN (
      SELECT cs.id FROM campaign_sessions cs
      JOIN campaigns c ON c.id = cs.campaign_id
      WHERE c.dm_user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE session_pack_notes;