-- Enable RLS on all SRD tables and grant SELECT to all authenticated users
-- This makes SRD data readable by everyone but only modifiable by service role

-- Ancestries
ALTER TABLE srd_ancestries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ancestries" ON srd_ancestries FOR SELECT TO authenticated USING (true);

-- Subancestries
ALTER TABLE srd_subancestries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subancestries" ON srd_subancestries FOR SELECT TO authenticated USING (true);

-- Backgrounds
ALTER TABLE srd_backgrounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view backgrounds" ON srd_backgrounds FOR SELECT TO authenticated USING (true);

-- Classes
ALTER TABLE srd_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view classes" ON srd_classes FOR SELECT TO authenticated USING (true);

-- Subclasses
ALTER TABLE srd_subclasses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subclasses" ON srd_subclasses FOR SELECT TO authenticated USING (true);

-- Class Features
ALTER TABLE srd_class_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view class features" ON srd_class_features FOR SELECT TO authenticated USING (true);

-- Subclass Features
ALTER TABLE srd_subclass_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subclass features" ON srd_subclass_features FOR SELECT TO authenticated USING (true);

-- Spell Slots
ALTER TABLE srd_spell_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view spell slots" ON srd_spell_slots FOR SELECT TO authenticated USING (true);

-- Spells
ALTER TABLE srd_spells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view spells" ON srd_spells FOR SELECT TO authenticated USING (true);

-- Equipment
ALTER TABLE srd_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view equipment" ON srd_equipment FOR SELECT TO authenticated USING (true);

-- Weapons
ALTER TABLE srd_weapons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view weapons" ON srd_weapons FOR SELECT TO authenticated USING (true);

-- Armor
ALTER TABLE srd_armor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view armor" ON srd_armor FOR SELECT TO authenticated USING (true);

-- Tools
ALTER TABLE srd_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tools" ON srd_tools FOR SELECT TO authenticated USING (true);

-- Languages
ALTER TABLE srd_languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view languages" ON srd_languages FOR SELECT TO authenticated USING (true);

-- Monster Catalog (already exists but ensure policy)
ALTER TABLE monster_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view monsters" ON monster_catalog;
CREATE POLICY "Anyone can view monsters" ON monster_catalog FOR SELECT TO authenticated USING (true);