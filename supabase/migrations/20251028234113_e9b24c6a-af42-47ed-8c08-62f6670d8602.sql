-- Add category field to lore_pages if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'lore_pages' AND column_name = 'category') THEN
    ALTER TABLE lore_pages ADD COLUMN category text NOT NULL DEFAULT 'regions';
  END IF;
END $$;

-- Add era/date field for timeline tracking
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'lore_pages' AND column_name = 'era') THEN
    ALTER TABLE lore_pages ADD COLUMN era text;
  END IF;
END $$;

-- Add index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_lore_pages_category ON lore_pages(category);
CREATE INDEX IF NOT EXISTS idx_lore_pages_campaign_category ON lore_pages(campaign_id, category);