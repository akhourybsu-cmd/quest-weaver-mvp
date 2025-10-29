-- Add details JSONB column to lore_pages for category-specific data
ALTER TABLE lore_pages ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::JSONB;

-- Create index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_lore_pages_details ON lore_pages USING gin(details);