-- Phase 7: Party Inventory & Magic Item Tracker

-- Items master catalog
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('MUNDANE','CONSUMABLE','MAGIC','CURRENCY')) DEFAULT 'MUNDANE',
  rarity TEXT CHECK (rarity IN ('Common','Uncommon','Rare','Very Rare','Legendary','Artifact') OR rarity IS NULL),
  description TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  source_ref TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Party and character holdings (current state)
CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  owner_type TEXT CHECK (owner_type IN ('PARTY','CHARACTER','NPC')) DEFAULT 'PARTY',
  owner_id UUID,
  quantity NUMERIC DEFAULT 1,
  is_attuned BOOLEAN DEFAULT false,
  attuned_to UUID REFERENCES characters(id),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trade/change history (append-only)
CREATE TABLE IF NOT EXISTS holding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT CHECK (event_type IN ('CREATE','TRADE','SPLIT','MERGE','CONSUME','ATTUNE','DETUNE','CHARGE_USE','CHARGE_RESTORE','DESTROY','RENAME','NOTE')) NOT NULL,
  item_id UUID REFERENCES items(id) NOT NULL,
  from_owner_type TEXT,
  from_owner_id UUID,
  to_owner_type TEXT,
  to_owner_id UUID,
  quantity_delta NUMERIC DEFAULT 0,
  payload JSONB DEFAULT '{}'::jsonb,
  author_id UUID REFERENCES auth.users(id),
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- Quick links to other entities
CREATE TABLE IF NOT EXISTS item_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  link_type TEXT CHECK (link_type IN ('QUEST','NPC','NOTE','LOCATION')) NOT NULL,
  link_id UUID NOT NULL,
  label TEXT
);

-- RLS Policies
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE holding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_links ENABLE ROW LEVEL SECURITY;

-- Items policies
CREATE POLICY "Campaign members can view items"
  ON items FOR SELECT
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "DMs can manage items"
  ON items FOR ALL
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  ));

CREATE POLICY "Players can create items they own"
  ON items FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT campaign_id FROM characters WHERE user_id = auth.uid()
  ));

-- Holdings policies
CREATE POLICY "Campaign members can view holdings"
  ON holdings FOR SELECT
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "DMs can manage holdings"
  ON holdings FOR ALL
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  ));

CREATE POLICY "Players can manage their own holdings"
  ON holdings FOR ALL
  USING (
    owner_type = 'CHARACTER' AND 
    owner_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
  );

CREATE POLICY "Players can add to party holdings"
  ON holdings FOR INSERT
  WITH CHECK (
    owner_type = 'PARTY' AND
    campaign_id IN (SELECT campaign_id FROM characters WHERE user_id = auth.uid())
  );

-- Holding events policies
CREATE POLICY "Campaign members can view holding events"
  ON holding_events FOR SELECT
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Authenticated users can create holding events"
  ON holding_events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
        SELECT campaign_id FROM characters WHERE user_id = auth.uid()
      )
    )
  );

-- Item links policies
CREATE POLICY "Campaign members can view item links"
  ON item_links FOR SELECT
  USING (item_id IN (
    SELECT id FROM items WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
        SELECT campaign_id FROM characters WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "DMs can manage item links"
  ON item_links FOR ALL
  USING (item_id IN (
    SELECT id FROM items WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
    )
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_campaign ON items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_holdings_campaign ON holdings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_holdings_item ON holdings(item_id);
CREATE INDEX IF NOT EXISTS idx_holdings_owner ON holdings(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_holding_events_campaign ON holding_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_holding_events_item ON holding_events(item_id);
CREATE INDEX IF NOT EXISTS idx_holding_events_occurred ON holding_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_links_item ON item_links(item_id);
CREATE INDEX IF NOT EXISTS idx_item_links_link ON item_links(link_type, link_id);

-- Triggers
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_holdings_updated_at
  BEFORE UPDATE ON holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE holdings;
ALTER PUBLICATION supabase_realtime ADD TABLE holding_events;
ALTER PUBLICATION supabase_realtime ADD TABLE item_links;