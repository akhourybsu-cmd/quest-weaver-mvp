-- Create campaign_messages table for player-DM communication
CREATE TABLE IF NOT EXISTS public.campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_dm_message BOOLEAN DEFAULT false,
  is_announcement BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign members can view messages
CREATE POLICY "Campaign members can view messages"
  ON public.campaign_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_messages.campaign_id
      AND (
        c.dm_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.characters
          WHERE campaign_id = c.id
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Campaign members can send messages
CREATE POLICY "Campaign members can send messages"
  ON public.campaign_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_messages.campaign_id
      AND (
        c.dm_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.characters
          WHERE campaign_id = c.id
          AND user_id = auth.uid()
        )
      )
    )
    AND sender_id = auth.uid()
  );

-- Policy: Only sender can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.campaign_messages
  FOR DELETE
  USING (sender_id = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_id ON public.campaign_messages(campaign_id, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_messages;