-- Create campaign_members table for role-based access
CREATE TABLE IF NOT EXISTS public.campaign_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('DM', 'PLAYER')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Enable RLS on campaign_members
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

-- Campaign members can view other members in their campaign
CREATE POLICY "Campaign members can view members"
ON public.campaign_members
FOR SELECT
USING (
  campaign_id IN (
    SELECT campaign_id FROM public.campaign_members
    WHERE user_id = auth.uid()
  )
);

-- Only DMs can manage campaign members
CREATE POLICY "DMs can manage members"
ON public.campaign_members
FOR ALL
USING (
  campaign_id IN (
    SELECT campaign_id FROM public.campaign_members
    WHERE user_id = auth.uid() AND role = 'DM'
  )
);

-- Helper function to get user's role in a campaign
CREATE OR REPLACE FUNCTION public.auth_role_in_campaign(camp_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.role 
  FROM campaign_members cm
  WHERE cm.campaign_id = camp_id 
    AND cm.user_id = auth.uid() 
  LIMIT 1;
$$;

-- Helper function to check if user owns a character
CREATE OR REPLACE FUNCTION public.character_owned_by_user(char_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM characters
    WHERE id = char_id AND user_id = auth.uid()
  );
$$;

-- Update session_notes policies to allow player self-writes
DROP POLICY IF EXISTS "Players can create their own lore pages" ON public.lore_pages;
DROP POLICY IF EXISTS "Players can update their own lore pages" ON public.lore_pages;

CREATE POLICY "Players can create shared/private notes"
ON public.session_notes
FOR INSERT
WITH CHECK (
  author_id = auth.uid() 
  AND visibility IN ('PRIVATE', 'SHARED')
  AND campaign_id IN (
    SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Players can update their own notes"
ON public.session_notes
FOR UPDATE
USING (author_id = auth.uid());

-- Update holdings policies to allow players to manage their character inventory
CREATE POLICY "Players can update their character holdings"
ON public.holdings
FOR UPDATE
USING (
  owner_type = 'CHARACTER' 
  AND character_owned_by_user(owner_id)
);

-- Migrate existing DM relationships to campaign_members
INSERT INTO public.campaign_members (campaign_id, user_id, role)
SELECT id, dm_user_id, 'DM'
FROM public.campaigns
ON CONFLICT (campaign_id, user_id) DO NOTHING;

-- Migrate existing player relationships (from characters table)
INSERT INTO public.campaign_members (campaign_id, user_id, role)
SELECT DISTINCT campaign_id, user_id, 'PLAYER'
FROM public.characters
WHERE campaign_id IS NOT NULL 
  AND user_id IS NOT NULL
ON CONFLICT (campaign_id, user_id) DO NOTHING;