import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCampaign } from '@/contexts/CampaignContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, Dice6 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PendingAction {
  type: 'save' | 'turn';
  encounterId?: string;
  savePromptId?: string;
  message: string;
}

export function AwaitingActionBanner() {
  const { campaign, role } = useCampaign();
  const navigate = useNavigate();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    if (!campaign || role !== 'PLAYER') return;

    const checkPendingActions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for active encounter with player's turn
      const { data: encounters } = await supabase
        .from('encounters')
        .select(`
          id,
          initiative!inner(character_id, is_current_turn),
          characters!inner(user_id)
        `)
        .eq('campaign_id', campaign.id)
        .eq('is_active', true)
        .eq('characters.user_id', user.id)
        .eq('initiative.is_current_turn', true)
        .limit(1);

      if (encounters && encounters.length > 0) {
        setPendingAction({
          type: 'turn',
          encounterId: encounters[0].id,
          message: "It's your turn in combat!",
        });
        return;
      }

      // Check for pending save prompts
      const { data: savePrompts } = await supabase
        .from('save_prompts')
        .select(`
          id,
          encounter_id,
          save_results!inner(character_id, result),
          characters!inner(user_id)
        `)
        .eq('status', 'active')
        .eq('characters.user_id', user.id)
        .is('save_results.result', null)
        .limit(1);

      if (savePrompts && savePrompts.length > 0) {
        setPendingAction({
          type: 'save',
          savePromptId: savePrompts[0].id,
          encounterId: savePrompts[0].encounter_id,
          message: `Saving throw required`,
        });
        return;
      }

      setPendingAction(null);
    };

    checkPendingActions();

    // Subscribe to changes
    const channel = supabase
      .channel('pending-actions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'initiative' },
        checkPendingActions
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'save_prompts' },
        checkPendingActions
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaign?.id, role]);

  if (!pendingAction) return null;

  const handleAction = () => {
    if (pendingAction.type === 'turn') {
      navigate(`/session-dm?code=${campaign?.code}`);
    } else if (pendingAction.type === 'save') {
      navigate(`/session-player?code=${campaign?.code}`);
    }
  };

  return (
    <Alert className="border-primary bg-primary/10 sticky top-0 z-50 mb-4">
      <Bell className="h-4 w-4" />
      <AlertTitle>Action Required</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{pendingAction.message}</span>
        <Button size="sm" onClick={handleAction} className="ml-4">
          <Dice6 className="h-4 w-4 mr-2" />
          {pendingAction.type === 'turn' ? 'Take Turn' : 'Roll Save'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
