import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  code: string;
}

interface AssignCharacterDialogProps {
  open: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  currentCampaignId?: string;
}

export const AssignCharacterDialog = ({
  open,
  onClose,
  characterId,
  characterName,
  currentCampaignId,
}: AssignCharacterDialogProps) => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      loadCampaigns();
    }
  }, [open]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get player profile
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!player) return;

      // Get all campaigns the player is linked to
      const { data: links, error } = await supabase
        .from('player_campaign_links')
        .select(`
          campaign_id,
          campaigns:campaign_id(id, name, code)
        `)
        .eq('player_id', player.id);

      if (error) throw error;

      const campaignList = links
        ?.map(link => link.campaigns)
        .filter(Boolean)
        .flat() as Campaign[];

      setCampaigns(campaignList || []);
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
      toast({
        title: 'Error loading campaigns',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToCampaign = async (campaignId: string) => {
    setAssigning(true);
    try {
      const { error } = await supabase
        .from('characters')
        .update({ campaign_id: campaignId })
        .eq('id', characterId);

      if (error) throw error;

      toast({
        title: 'Character assigned!',
        description: `${characterName} has been assigned to the campaign`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error assigning character',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to Campaign</DialogTitle>
          <DialogDescription>
            Choose which campaign to assign {characterName} to
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-brass" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            You haven't joined any campaigns yet. Join a campaign first to assign characters.
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className={`transition-colors ${
                  campaign.id === currentCampaignId
                    ? 'border-brass bg-brass/10'
                    : 'hover:border-primary'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{campaign.name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        {campaign.code}
                      </p>
                    </div>
                    {campaign.id === currentCampaignId ? (
                      <Badge variant="secondary">Current</Badge>
                    ) : (
                      <Button
                        onClick={() => handleAssignToCampaign(campaign.id)}
                        disabled={assigning}
                        size="sm"
                      >
                        {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};