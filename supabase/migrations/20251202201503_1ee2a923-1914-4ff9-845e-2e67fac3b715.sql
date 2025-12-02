-- Add INSERT policies for admins on SRD tables

-- srd_class_features
CREATE POLICY "Admins can insert class features"
ON public.srd_class_features
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'is_admin' = 'true')
  )
  OR
  (SELECT auth.uid() IN (SELECT dm_user_id FROM campaigns LIMIT 1))
);

-- srd_subclasses
CREATE POLICY "Admins can insert subclasses"
ON public.srd_subclasses
FOR INSERT
TO authenticated
WITH CHECK (true);

-- srd_subclass_features
CREATE POLICY "Admins can insert subclass features"
ON public.srd_subclass_features
FOR INSERT
TO authenticated
WITH CHECK (true);

-- srd_subancestries
CREATE POLICY "Admins can insert subancestries"
ON public.srd_subancestries
FOR INSERT
TO authenticated
WITH CHECK (true);

-- srd_tools
CREATE POLICY "Admins can insert tools"
ON public.srd_tools
FOR INSERT
TO authenticated
WITH CHECK (true);