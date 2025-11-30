-- Drop the broken trigger that references a non-existent updated_at column
DROP TRIGGER IF EXISTS update_player_campaign_links_updated_at ON player_campaign_links;