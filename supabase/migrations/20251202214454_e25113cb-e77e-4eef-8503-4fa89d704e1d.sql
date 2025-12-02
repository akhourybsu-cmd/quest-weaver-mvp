-- Update RLS policies for srd_class_features to allow authenticated users to insert
DROP POLICY IF EXISTS "Admins can insert class features" ON srd_class_features;
CREATE POLICY "Authenticated users can insert class features"
ON srd_class_features FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update RLS policies for srd_subclasses to allow authenticated users to insert
DROP POLICY IF EXISTS "Admins can insert subclasses" ON srd_subclasses;
CREATE POLICY "Authenticated users can insert subclasses"
ON srd_subclasses FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update RLS policies for srd_subclass_features to allow authenticated users to insert
DROP POLICY IF EXISTS "Admins can insert subclass features" ON srd_subclass_features;
CREATE POLICY "Authenticated users can insert subclass features"
ON srd_subclass_features FOR INSERT
TO authenticated
WITH CHECK (true);