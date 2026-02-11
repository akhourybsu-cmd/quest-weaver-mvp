import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Lightbulb,
  Bug,
  BookOpen,
  Target,
  Swords,
  ArrowLeft,
  Plus,
  MessageSquare,
  Eye,
  Pin,
  Lock,
  Clock,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

interface ForumTopic {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  reply_count?: number;
  author_name?: string;
}

interface ForumReply {
  id: string;
  topic_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

interface AuthorProfile {
  name: string;
  avatar_url: string | null;
  color: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Lightbulb,
  Bug,
  BookOpen,
  Target,
  Swords,
};

const Community = () => {
  const navigate = useNavigate();
  const { categoryId, topicId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [currentTopic, setCurrentTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // New topic form
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Reply form
  const [replyContent, setReplyContent] = useState("");

  // Author profiles cache
  const [authorProfiles, setAuthorProfiles] = useState<Record<string, AuthorProfile>>({});

  const fetchAuthorProfiles = async (authorIds: string[]) => {
    const uniqueIds = [...new Set(authorIds)].filter(id => !authorProfiles[id]);
    if (uniqueIds.length === 0) return;
    const { data } = await supabase
      .from('players')
      .select('user_id, name, avatar_url, color')
      .in('user_id', uniqueIds);
    if (data) {
      const profileMap: Record<string, AuthorProfile> = {};
      data.forEach(p => {
        profileMap[p.user_id] = { name: p.name, avatar_url: p.avatar_url || null, color: p.color || '#8B7355' };
      });
      setAuthorProfiles(prev => ({ ...prev, ...profileMap }));
    }
  };

  useEffect(() => {
    checkUser();
    loadCategories();
  }, []);

  useEffect(() => {
    if (topicId) {
      loadTopic(topicId);
    } else if (categoryId) {
      loadTopics(categoryId);
    }
  }, [categoryId, topicId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("forum_categories")
      .select("*")
      .order("sort_order");
    
    if (error) {
      console.error("Error loading categories:", error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const loadTopics = async (catId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("forum_topics")
      .select("*")
      .eq("category_id", catId)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    
    if (error) {
      console.error("Error loading topics:", error);
    } else {
      // Count replies for each topic
      const topicsWithCounts = await Promise.all(
        (data || []).map(async (topic) => {
          const { count } = await supabase
            .from("forum_replies")
            .select("*", { count: "exact", head: true })
            .eq("topic_id", topic.id);
          return { ...topic, reply_count: count || 0 };
        })
      );
      setTopics(topicsWithCounts);
      // Fetch author profiles for topics
      const authorIds = (data || []).map(t => t.author_id);
      fetchAuthorProfiles(authorIds);
    }
    setLoading(false);
  };

  const loadTopic = async (tId: string) => {
    setLoading(true);
    
    // Load topic
    const { data: topicData, error: topicError } = await supabase
      .from("forum_topics")
      .select("*")
      .eq("id", tId)
      .single();
    
    if (topicError) {
      console.error("Error loading topic:", topicError);
      setLoading(false);
      return;
    }
    
    setCurrentTopic(topicData);
    
    // Increment view count
    await supabase
      .from("forum_topics")
      .update({ view_count: (topicData.view_count || 0) + 1 })
      .eq("id", tId);
    
    // Load replies
    const { data: repliesData, error: repliesError } = await supabase
      .from("forum_replies")
      .select("*")
      .eq("topic_id", tId)
      .order("created_at");
    
    if (repliesError) {
      console.error("Error loading replies:", repliesError);
    } else {
      setReplies(repliesData || []);
    }
    
    // Fetch author profiles for topic + replies
    const allAuthorIds = [topicData.author_id, ...(repliesData || []).map(r => r.author_id)];
    fetchAuthorProfiles(allAuthorIds);
    
    setLoading(false);
  };

  const handleCreateTopic = async () => {
    if (!user) {
      toast({ title: "Please sign in to create a topic", variant: "destructive" });
      return;
    }
    
    if (!newTopicTitle.trim() || !newTopicContent.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    
    const { data, error } = await supabase
      .from("forum_topics")
      .insert({
        category_id: categoryId,
        author_id: user.id,
        title: newTopicTitle.trim(),
        content: newTopicContent.trim(),
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: "Failed to create topic", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Topic created!" });
      setNewTopicOpen(false);
      setNewTopicTitle("");
      setNewTopicContent("");
      navigate(`/community/topic/${data.id}`);
    }
    
    setSubmitting(false);
  };

  const handleCreateReply = async () => {
    if (!user) {
      toast({ title: "Please sign in to reply", variant: "destructive" });
      return;
    }
    
    if (!replyContent.trim()) {
      toast({ title: "Please enter a reply", variant: "destructive" });
      return;
    }
    
    if (currentTopic?.is_locked) {
      toast({ title: "This topic is locked", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    
    const { error } = await supabase
      .from("forum_replies")
      .insert({
        topic_id: topicId,
        author_id: user.id,
        content: replyContent.trim(),
      });
    
    if (error) {
      toast({ title: "Failed to post reply", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reply posted!" });
      setReplyContent("");
      if (topicId) loadTopic(topicId);
    }
    
    setSubmitting(false);
  };

  const getCategoryIcon = (iconName: string | null) => {
    const Icon = iconName && iconMap[iconName] ? iconMap[iconName] : MessageCircle;
    return <Icon className="w-6 h-6" />;
  };

  // Category List View
  if (!categoryId && !topicId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <h1 className="text-3xl font-cinzel font-bold">Community Forum</h1>
          </div>
          
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Join the conversation! Share your experiences, suggest features, report bugs, 
            and connect with other Quest Weaver users.
          </p>
          
          {!user && (
            <Card className="p-4 mb-8 border-brand-brass/30 bg-brand-arcanePurple/5">
              <p className="text-sm">
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/auth")}>
                  Sign in
                </Button>
                {" "}to create topics and join discussions.
              </p>
            </Card>
          )}
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="p-6 cursor-pointer hover:border-brand-brass/60 transition-all hover:-translate-y-1 border-2 border-brand-brass/30"
                onClick={() => navigate(`/community/${category.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-brand-arcanePurple/10 flex items-center justify-center text-brand-arcanePurple">
                    {getCategoryIcon(category.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-cinzel font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Topic List View
  if (categoryId && !topicId) {
    const currentCategory = categories.find(c => c.id === categoryId);
    
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/community")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Categories
            </Button>
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-brand-arcanePurple/10 flex items-center justify-center text-brand-arcanePurple">
                {getCategoryIcon(currentCategory?.icon || null)}
              </div>
              <div>
                <h1 className="text-2xl font-cinzel font-bold">{currentCategory?.name}</h1>
                <p className="text-sm text-muted-foreground">{currentCategory?.description}</p>
              </div>
            </div>
            
            {user && (
              <Dialog open={newTopicOpen} onOpenChange={setNewTopicOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Topic
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Topic</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Topic title"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Write your post..."
                      value={newTopicContent}
                      onChange={(e) => setNewTopicContent(e.target.value)}
                      rows={6}
                    />
                    <Button 
                      onClick={handleCreateTopic} 
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? "Creating..." : "Create Topic"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading topics...</div>
          ) : topics.length === 0 ? (
            <Card className="p-12 text-center border-2 border-brand-brass/30">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No topics yet. Be the first to start a discussion!</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {topics.map((topic) => (
                <Card
                  key={topic.id}
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border border-border"
                  onClick={() => navigate(`/community/topic/${topic.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {topic.is_pinned && <Pin className="w-3 h-3 text-brand-arcanePurple" />}
                        {topic.is_locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                        <h3 className="font-medium truncate">{topic.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{topic.content}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {topic.reply_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {topic.view_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(topic.updated_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Topic Detail View
  if (topicId && currentTopic) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/community/${currentTopic.category_id}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Button>
          
          {/* Original Post */}
          <Card className="p-6 mb-6 border-2 border-brand-brass/30">
            <div className="flex items-center gap-2 mb-4">
              {currentTopic.is_pinned && (
                <Badge variant="secondary" className="text-xs">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {currentTopic.is_locked && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl font-cinzel font-bold mb-4">{currentTopic.title}</h1>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <User className="w-4 h-4" />
              <span>Posted {formatDistanceToNow(new Date(currentTopic.created_at), { addSuffix: true })}</span>
              <span>•</span>
              <Eye className="w-4 h-4" />
              <span>{currentTopic.view_count} views</span>
            </div>
            
            <Separator className="my-4" />
            
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{currentTopic.content}</p>
            </div>
          </Card>
          
          {/* Replies */}
          <h2 className="text-lg font-semibold mb-4">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h2>
          
          <div className="space-y-4 mb-8">
            {replies.map((reply) => (
              <Card key={reply.id} className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <User className="w-4 h-4" />
                  <span>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                </div>
                <p className="whitespace-pre-wrap">{reply.content}</p>
              </Card>
            ))}
          </div>
          
          {/* Reply Form */}
          {!currentTopic.is_locked && (
            <Card className="p-4 border-2 border-brand-brass/30">
              {user ? (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Write your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleCreateReply} disabled={submitting}>
                    {submitting ? "Posting..." : "Post Reply"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/auth")}>
                    Sign in
                  </Button>
                  {" "}to reply to this topic.
                </p>
              )}
            </Card>
          )}
          
          {currentTopic.is_locked && (
            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                <Lock className="w-4 h-4 inline mr-2" />
                This topic is locked. No new replies can be added.
              </p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
};

export default Community;
