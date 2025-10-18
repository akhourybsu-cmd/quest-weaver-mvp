import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import PlayerPresence from "@/components/presence/PlayerPresence";
import { TurnIndicator } from "@/components/presence/TurnIndicator";
import { DMQuickstart } from "@/components/onboarding/DMQuickstart";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { EncounterControls } from "@/components/combat/EncounterControls";
import { NeedRulingIndicator } from "@/components/combat/NeedRulingIndicator";
import MonsterLibraryDialog from "@/components/monsters/MonsterLibraryDialog";
import SavePromptDialog from "@/components/combat/SavePromptDialog";
import EffectDialog from "@/components/combat/EffectDialog";
import { DMScreenGrid } from "@/components/dm/DMScreenGrid";
import { ViewSwitch } from "@/components/permissions/ViewSwitch";

interface Encounter {
  id: string;
  name: string;
  current_round: number;
  is_active: boolean;
  status: 'preparing' | 'active' | 'paused' | 'ended';
}

const SessionDM = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignId = searchParams.get("campaign");
  const { toast } = useToast();

  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      navigate("/campaign-hub");
      return;
    }

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };

    loadUser();
    fetchActiveEncounter();
    
    const encountersChannel = supabase
      .channel(`dm-encounters:${campaignId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'encounters',
        filter: `campaign_id=eq.${campaignId}`,
      }, () => fetchActiveEncounter())
      .subscribe();

    return () => { supabase.removeChannel(encountersChannel); };
  }, [campaignId, navigate]);

  const fetchActiveEncounter = async () => {
    const { data, error } = await supabase
      .from("encounters")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      toast({ title: "Error loading encounter", description: error.message, variant: "destructive" });
      return;
    }

    setActiveEncounter(data);
    setLoading(false);
  };

  const createEncounter = async () => {
    const { data, error } = await supabase
      .from("encounters")
      .insert({
        campaign_id: campaignId,
        name: `Encounter ${new Date().toLocaleDateString()}`,
        current_round: 1,
        is_active: true,
        status: 'preparing',
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating encounter", description: error.message, variant: "destructive" });
      return;
    }

    setActiveEncounter(data);
    toast({ title: "Encounter Started", description: "Roll initiative!" });
  };

  const handlePromptSave = async (data: any) => {
    if (!activeEncounter) return;
    const { data: targets } = await supabase.rpc('compute_save_prompt_targets', {
      _encounter_id: activeEncounter.id,
      _target_scope: data.targetScope,
      _target_character_ids: null
    });

    await supabase.from("save_prompts").insert([{
      encounter_id: activeEncounter.id,
      ability: data.ability,
      dc: data.dc,
      description: data.description,
      target_scope: data.targetScope,
      advantage_mode: data.advantageMode,
      half_on_success: data.halfOnSuccess,
      target_character_ids: targets,
      expected_responses: targets?.length || 0,
      received_responses: 0,
    }]);

    toast({ title: "Save Prompt Sent" });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading campaign...</div></div>;
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">DM Screen</h1>
              <p className="text-sm text-muted-foreground">
                {activeEncounter ? `Round ${activeEncounter.current_round}` : "No active encounter"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ViewSwitch />
              <DMQuickstart />
              {campaignId && <NeedRulingIndicator campaignId={campaignId} />}
              {activeEncounter && (
                <EncounterControls encounterId={activeEncounter.id} status={activeEncounter.status} hasInitiative={true} />
              )}
              {!activeEncounter && (
                <Button onClick={createEncounter} size="sm">
                  <Swords className="w-4 h-4 mr-2" />
                  Start Combat
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {activeEncounter && campaignId && (
          <TurnIndicator encounterId={activeEncounter.id} campaignId={campaignId} />
        )}
        {currentUserId && (
          <PlayerPresence campaignId={campaignId!} currentUserId={currentUserId} isDM={true} />
        )}

        <DMScreenGrid campaignId={campaignId!} encounterId={activeEncounter?.id} />

        {activeEncounter && (
          <>
            <MonsterLibraryDialog encounterId={activeEncounter.id} onMonstersAdded={fetchActiveEncounter} />
            <SavePromptDialog encounterId={activeEncounter.id} onPromptSave={handlePromptSave} />
            <EffectDialog encounterId={activeEncounter.id} currentRound={activeEncounter.current_round} characters={[]} />
          </>
        )}
      </main>

      <BottomNav role="dm" />
    </div>
  );
};

export default SessionDM;
