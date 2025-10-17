-- Add missing SRD tables for complete Open5e data

-- Feats table
CREATE TABLE IF NOT EXISTS srd_feats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  prerequisite TEXT,
  description TEXT,
  document TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conditions table
CREATE TABLE IF NOT EXISTS srd_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  document TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Magic Items table
CREATE TABLE IF NOT EXISTS srd_magic_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  rarity TEXT,
  requires_attunement BOOLEAN DEFAULT false,
  description TEXT,
  document TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Planes table
CREATE TABLE IF NOT EXISTS srd_planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  document TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sections table (for general content/lore)
CREATE TABLE IF NOT EXISTS srd_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent TEXT,
  description TEXT,
  document TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents metadata table
CREATE TABLE IF NOT EXISTS srd_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spell to class mapping table
CREATE TABLE IF NOT EXISTS srd_spell_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spell_slug TEXT NOT NULL,
  class_slug TEXT NOT NULL,
  level INTEGER NOT NULL,
  UNIQUE(spell_slug, class_slug)
);

-- Enable RLS on all new tables
ALTER TABLE srd_feats ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_magic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE srd_spell_classes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all SRD data
CREATE POLICY "Authenticated users can view feats" ON srd_feats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view conditions" ON srd_conditions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view magic items" ON srd_magic_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view planes" ON srd_planes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view sections" ON srd_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view documents" ON srd_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view spell classes" ON srd_spell_classes FOR SELECT TO authenticated USING (true);