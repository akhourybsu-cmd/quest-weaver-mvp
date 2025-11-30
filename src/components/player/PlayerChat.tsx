import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Megaphone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  is_dm_message: boolean;
  is_announcement: boolean;
  created_at: string;
}

interface PlayerChatProps {
  campaignId: string;
  currentUserId: string;
  isDM?: boolean;
}

export const PlayerChat = ({ campaignId, currentUserId, isDM = false }: PlayerChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSenderName();
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`campaign-messages:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_messages',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchSenderName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is DM
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('dm_user_id, name')
        .eq('id', campaignId)
        .single();

      if (campaign?.dm_user_id === user.id) {
        setSenderName('Dungeon Master');
      } else {
        // Get player name from characters table
        const { data: character } = await supabase
          .from('characters')
          .select('name')
          .eq('campaign_id', campaignId)
          .eq('user_id', user.id)
          .maybeSingle();

        setSenderName(character?.name || 'Player');
      }
    } catch (error) {
      console.error('Error fetching sender name:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('campaign_messages')
        .insert({
          campaign_id: campaignId,
          sender_id: user.id,
          sender_name: senderName,
          message: newMessage.trim(),
          is_dm_message: isDM,
          is_announcement: isDM && isAnnouncement,
        });

      if (error) throw error;

      setNewMessage('');
      setIsAnnouncement(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="font-cinzel text-xl flex items-center gap-2">
          Campaign Chat
          <Badge variant="outline" className="ml-auto">
            {messages.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.sender_id === currentUserId ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className={msg.is_dm_message ? 'bg-brass/20 text-brass' : 'bg-primary/20'}>
                      {msg.sender_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col gap-1 max-w-[75%] ${
                      msg.sender_id === currentUserId ? 'items-end' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">
                        {msg.sender_name}
                      </span>
                      {msg.is_dm_message && (
                        <Badge variant="secondary" className="text-xs">
                          DM
                        </Badge>
                      )}
                      {msg.is_announcement && (
                        <Badge className="text-xs bg-brass/80">
                          <Megaphone className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        msg.is_announcement
                          ? 'bg-brass/20 border border-brass/40'
                          : msg.sender_id === currentUserId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 space-y-2">
            {isDM && (
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnnouncement}
                  onChange={(e) => setIsAnnouncement(e.target.checked)}
                  className="rounded"
                />
                Send as Announcement
              </label>
            )}
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              maxLength={500}
            />
          </div>
          <Button type="submit" disabled={!newMessage.trim() || sending} size="icon">
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
