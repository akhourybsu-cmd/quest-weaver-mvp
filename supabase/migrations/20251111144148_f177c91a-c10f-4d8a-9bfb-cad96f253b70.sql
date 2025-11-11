-- P0 Gap 3: Add identification tracking to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS identified boolean DEFAULT true;
COMMENT ON COLUMN items.identified IS 'Whether the magic item has been identified (DMG 136)';

ALTER TABLE character_equipment ADD COLUMN IF NOT EXISTS identified boolean DEFAULT true;
COMMENT ON COLUMN character_equipment.identified IS 'Whether the magic item has been identified';

-- Update existing items to be identified by default
UPDATE items SET identified = true WHERE identified IS NULL;
UPDATE character_equipment SET identified = true WHERE identified IS NULL;