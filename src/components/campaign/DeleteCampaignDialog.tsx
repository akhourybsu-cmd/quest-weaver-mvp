import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: {
    id: string;
    name: string;
  } | null;
  onSuccess: () => void;
}

export function DeleteCampaignDialog({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: DeleteCampaignDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    players: 0,
    sessions: 0,
    quests: 0,
    npcs: 0,
    items: 0,
  });

  const fetchStats = async () => {
    if (!campaign) return;

    try {
      const [players, sessions, quests, npcs, items] = await Promise.all([
        supabase.from("characters").select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id).not("user_id", "is", null),
        supabase.from("campaign_sessions").select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id),
        supabase.from("quests").select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id),
        supabase.from("npcs").select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id),
        supabase.from("items").select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id),
      ]);

      setStats({
        players: players.count || 0,
        sessions: sessions.count || 0,
        quests: quests.count || 0,
        npcs: npcs.count || 0,
        items: items.count || 0,
      });
    } catch (error) {
      console.error("Failed to fetch campaign stats:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setStep(1);
      setConfirmName("");
      fetchStats();
    }
    onOpenChange(newOpen);
  };

  const handleDelete = async () => {
    if (!campaign) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaign.id);

      if (error) throw error;

      toast({
        title: "Campaign deleted",
        description: "All campaign data has been permanently removed",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to delete campaign",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!campaign) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        {step === 1 && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Delete Campaign: {campaign.name}
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the campaign and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold mb-3">What will be deleted:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Players:</span>
                    <span className="font-medium">{stats.players}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sessions:</span>
                    <span className="font-medium">{stats.sessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quests:</span>
                    <span className="font-medium">{stats.quests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NPCs:</span>
                    <span className="font-medium">{stats.npcs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="font-medium">{stats.items}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                All characters, sessions, quests, NPCs, locations, factions, items, notes, and combat data will be permanently removed.
              </p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => setStep(2)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Campaign Name</AlertDialogTitle>
              <AlertDialogDescription>
                Type <strong>{campaign.name}</strong> to confirm deletion
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4">
              <Label htmlFor="confirm-name">Campaign Name</Label>
              <Input
                id="confirm-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={campaign.name}
                className="mt-2"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStep(1)}>Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => setStep(3)}
                disabled={confirmName !== campaign.name}
                className="bg-destructive hover:bg-destructive/90"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}

        {step === 3 && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">Final Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you absolutely sure? This is your last chance to cancel.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm font-medium">
                  Once deleted, there is no way to recover this campaign or any of its data.
                </p>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStep(2)} disabled={loading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Campaign Permanently"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
