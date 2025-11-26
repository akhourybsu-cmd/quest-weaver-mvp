-- Create profiles table if it doesn't exist (for forum author references)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Forum Categories
CREATE TABLE public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on forum_categories
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view forum categories" ON public.forum_categories
  FOR SELECT USING (true);

-- Forum Topics
CREATE TABLE public.forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on forum_topics
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;

-- Topic policies
CREATE POLICY "Anyone can view forum topics" ON public.forum_topics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create topics" ON public.forum_topics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

CREATE POLICY "Authors can update own topics" ON public.forum_topics
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own topics" ON public.forum_topics
  FOR DELETE USING (auth.uid() = author_id);

-- Forum Replies
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on forum_replies
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Reply policies
CREATE POLICY "Anyone can view forum replies" ON public.forum_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON public.forum_replies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

CREATE POLICY "Authors can update own replies" ON public.forum_replies
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own replies" ON public.forum_replies
  FOR DELETE USING (auth.uid() = author_id);

-- Seed default forum categories
INSERT INTO public.forum_categories (name, description, icon, sort_order) VALUES
  ('General Discussion', 'Chat about anything D&D related', 'MessageCircle', 1),
  ('Feature Requests', 'Suggest new features for Quest Weaver', 'Lightbulb', 2),
  ('Bug Reports', 'Report issues you encounter', 'Bug', 3),
  ('Campaign Stories', 'Share tales from your adventures', 'BookOpen', 4),
  ('Tips & Tricks', 'Share your best DM and player strategies', 'Target', 5),
  ('Character Builds', 'Discuss character optimization and builds', 'Swords', 6);

-- Enable realtime for forum tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_replies;