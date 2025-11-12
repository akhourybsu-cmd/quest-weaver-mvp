-- Enable realtime publications for campaign content tables (skip campaign_sessions as it's already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_highlights;