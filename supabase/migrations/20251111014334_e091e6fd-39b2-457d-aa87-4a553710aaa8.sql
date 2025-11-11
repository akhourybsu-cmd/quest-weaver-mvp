-- Update srd_feats table structure for Phase 1
-- Drop old columns if they exist and add new ones

-- Ensure the table has the correct structure
DO $$ 
BEGIN
  -- Drop old columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'srd_feats' AND column_name = 'slug') THEN
    ALTER TABLE public.srd_feats DROP COLUMN IF EXISTS slug;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'srd_feats' AND column_name = 'prerequisite') THEN
    ALTER TABLE public.srd_feats DROP COLUMN IF EXISTS prerequisite;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'srd_feats' AND column_name = 'document') THEN
    ALTER TABLE public.srd_feats DROP COLUMN IF EXISTS document;
  END IF;
  
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'srd_feats' AND column_name = 'prerequisites') THEN
    ALTER TABLE public.srd_feats ADD COLUMN prerequisites JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'srd_feats' AND column_name = 'ability_increases') THEN
    ALTER TABLE public.srd_feats ADD COLUMN ability_increases JSONB DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'srd_feats' AND column_name = 'grants') THEN
    ALTER TABLE public.srd_feats ADD COLUMN grants JSONB DEFAULT '{}';
  END IF;
END $$;