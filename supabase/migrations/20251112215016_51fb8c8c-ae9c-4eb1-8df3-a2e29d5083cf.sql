-- Fix search_path security warnings for location functions

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_location_path()
RETURNS trigger AS $$
BEGIN
  NEW.path := compute_location_path(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;