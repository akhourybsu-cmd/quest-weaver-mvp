import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCampaign } from '@/contexts/CampaignContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PresenceState {
  user_id: string;
  role: 'DM' | 'PLAYER';
  online_at: string;
}

export function PresenceBar() {
  const { campaign, member } = useCampaign();
  const [presences, setPresences] = useState<PresenceState[]>([]);

  useEffect(() => {
    if (!campaign || !member) return;

    const channel = supabase.channel(`campaign_presence_${campaign.id}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const allPresences = Object.values(state).flat();
        setPresences(allPresences);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: member.user_id,
            role: member.role,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [campaign?.id, member]);

  if (presences.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
      <span className="text-xs font-medium text-muted-foreground">Online:</span>
      <div className="flex -space-x-2">
        {presences.map((presence, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {presence.role === 'DM' ? 'DM' : `P${idx + 1}`}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>{presence.role}</span>
                  {presence.role === 'DM' && (
                    <Badge variant="secondary" className="text-xs">DM</Badge>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
