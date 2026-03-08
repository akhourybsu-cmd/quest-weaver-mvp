
-- Fix overly permissive INSERT policies on 5 SRD tables
-- Restrict to admin-only using is_current_user_admin()

DROP POLICY IF EXISTS "Authenticated users can insert class features" ON public.srd_class_features;
CREATE POLICY "Admins can insert class features" ON public.srd_class_features
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can insert subancestries" ON public.srd_subancestries;
CREATE POLICY "Admins can insert subancestries" ON public.srd_subancestries
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Authenticated users can insert subclass features" ON public.srd_subclass_features;
CREATE POLICY "Admins can insert subclass features" ON public.srd_subclass_features
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Authenticated users can insert subclasses" ON public.srd_subclasses;
CREATE POLICY "Admins can insert subclasses" ON public.srd_subclasses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can insert tools" ON public.srd_tools;
CREATE POLICY "Admins can insert tools" ON public.srd_tools
  FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());
