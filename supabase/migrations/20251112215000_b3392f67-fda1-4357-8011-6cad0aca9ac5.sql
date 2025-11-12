-- Phase 1: Add path column and hierarchy functions

-- Add path column for efficient hierarchy queries
ALTER TABLE locations ADD COLUMN IF NOT EXISTS path text;

-- Create index for path queries
CREATE INDEX IF NOT EXISTS idx_locations_path ON locations(path);

-- Function to compute path from parent chain
CREATE OR REPLACE FUNCTION compute_location_path(loc_id uuid)
RETURNS text AS $$
DECLARE
  result text := '';
  current_id uuid := loc_id;
  current_name text;
  parent_id uuid;
  depth int := 0;
  max_depth int := 20;
BEGIN
  LOOP
    SELECT name, parent_location_id INTO current_name, parent_id
    FROM locations WHERE id = current_id;
    
    EXIT WHEN current_id IS NULL OR depth >= max_depth;
    
    result := '/' || current_name || result;
    current_id := parent_id;
    depth := depth + 1;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update path on insert/update
CREATE OR REPLACE FUNCTION update_location_path()
RETURNS trigger AS $$
BEGIN
  NEW.path := compute_location_path(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS location_path_trigger ON locations;
CREATE TRIGGER location_path_trigger
  BEFORE INSERT OR UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_location_path();

-- Backfill existing locations
UPDATE locations SET path = compute_location_path(id) WHERE path IS NULL;