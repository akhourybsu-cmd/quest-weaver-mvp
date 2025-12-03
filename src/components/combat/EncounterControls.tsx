import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EncounterControlsProps {
  encounterId: string;
  status: 'preparing' | 'active' | 'paused' | 'ended';
  hasInitiative: boolean;
}

export function EncounterControls({
  encounterId,
  status,
  hasInitiative,
}: EncounterControlsProps) {
  const { toast } = useToast();

  const updateStatus = async (newStatus: 'preparing' | 'active' | 'paused' | 'ended') => {
    const { error } = await supabase
      .from('encounters')
      .update({ 
        status: newStatus,
        is_active: newStatus === 'active' || newStatus === 'paused'
      })
      .eq('id', encounterId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update encounter status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Encounter Updated",
        description: `Encounter ${newStatus}`,
      });
    }
  };

  const handleEndEncounter = async () => {
    // Clear all initiative
    await supabase
      .from('initiative')
      .delete()
      .eq('encounter_id', encounterId);

    // Reset encounter
    await supabase
      .from('encounters')
      .update({ 
        status: 'ended',
        is_active: false,
        current_round: 0
      })
      .eq('id', encounterId);

    toast({
      title: "Encounter Ended",
      description: "Initiative cleared and encounter reset",
    });
  };

  const handleResetEncounter = async () => {
    await supabase
      .from('encounters')
      .update({ 
        status: 'preparing',
        is_active: false,
        current_round: 0
      })
      .eq('id', encounterId);

    toast({
      title: "Encounter Reset",
      description: "Ready to start a new encounter",
    });
  };

  const getStatusBadge = () => {
    const variants = {
      preparing: { variant: "secondary" as const, label: "Preparing" },
      active: { variant: "default" as const, label: "Active" },
      paused: { variant: "outline" as const, label: "Paused" },
      ended: { variant: "destructive" as const, label: "Ended" },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}

      {status === 'preparing' && (
        <Button
          onClick={() => updateStatus('active')}
          size="sm"
          variant="default"
        >
          <Play className="w-4 h-4 mr-1" />
          {hasInitiative ? 'Start Encounter' : 'Start Combat'}
        </Button>
      )}

      {status === 'active' && (
        <>
          <Button
            onClick={() => updateStatus('paused')}
            size="sm"
            variant="outline"
          >
            <Pause className="w-4 h-4 mr-1" />
            Pause
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Square className="w-4 h-4 mr-1" />
                End
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Encounter?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all initiative and reset the encounter. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEndEncounter}>
                  End Encounter
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {status === 'paused' && (
        <>
          <Button
            onClick={() => updateStatus('active')}
            size="sm"
            variant="default"
          >
            <Play className="w-4 h-4 mr-1" />
            Resume
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Square className="w-4 h-4 mr-1" />
                End
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Encounter?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all initiative and reset the encounter. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEndEncounter}>
                  End Encounter
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {status === 'ended' && (
        <Button
          onClick={handleResetEncounter}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}
