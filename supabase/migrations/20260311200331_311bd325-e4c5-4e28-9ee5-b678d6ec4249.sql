
-- Create changelog_entries table
CREATE TABLE public.changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create changelog_changes table
CREATE TABLE public.changelog_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES public.changelog_entries(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feature', 'improvement', 'fix')),
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog_changes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read changelog entries"
  ON public.changelog_entries FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read changelog changes"
  ON public.changelog_changes FOR SELECT
  USING (true);

-- Admin write access using existing has_role function
CREATE POLICY "Admins can insert changelog entries"
  ON public.changelog_entries FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update changelog entries"
  ON public.changelog_entries FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete changelog entries"
  ON public.changelog_entries FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert changelog changes"
  ON public.changelog_changes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update changelog changes"
  ON public.changelog_changes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete changelog changes"
  ON public.changelog_changes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
