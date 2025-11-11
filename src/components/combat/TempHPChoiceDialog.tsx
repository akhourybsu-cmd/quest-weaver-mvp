import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { keepCurrentTempHP, takeNewTempHP, type TempHPChoice } from "@/lib/tempHPManager";
import { toast } from "sonner";

interface TempHPChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
  choice: TempHPChoice;
}

export function TempHPChoiceDialog({
  open,
  onOpenChange,
  characterId,
  characterName,
  choice,
}: TempHPChoiceDialogProps) {
  const handleKeepCurrent = async () => {
    await keepCurrentTempHP(characterId);
    toast.success(`${characterName} keeps ${choice.current} temp HP`);
    onOpenChange(false);
  };

  const handleTakeNew = async () => {
    await takeNewTempHP(characterId, choice.new);
    toast.success(`${characterName} now has ${choice.new} temp HP from ${choice.source}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Temporary Hit Points
          </DialogTitle>
          <DialogDescription>
            Choose which temporary HP to keep
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Temp HP */}
          <div className="p-4 border rounded-lg">
            <div className="font-semibold mb-2">Current Temporary HP</div>
            <div className="text-3xl font-bold text-primary">{choice.current} HP</div>
          </div>

          {/* New Temp HP */}
          <div className="p-4 border rounded-lg">
            <div className="font-semibold mb-2">New Temporary HP</div>
            <div className="text-3xl font-bold text-secondary">{choice.new} HP</div>
            <div className="text-sm text-muted-foreground mt-1">From: {choice.source}</div>
          </div>

          {/* RAW Rule */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>RAW:</strong> Temporary hit points don't stack. If you have temporary hit points and receive more of them, you decide whether to keep the ones you have or to gain the new ones. (PHB 198)
            </AlertDescription>
          </Alert>

          {/* Choice Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleKeepCurrent}
              variant="outline"
              className="h-auto py-4"
            >
              <div className="text-center">
                <div className="font-semibold">Keep Current</div>
                <div className="text-2xl">{choice.current}</div>
              </div>
            </Button>
            <Button
              onClick={handleTakeNew}
              variant="default"
              className="h-auto py-4"
            >
              <div className="text-center">
                <div className="font-semibold">Take New</div>
                <div className="text-2xl">{choice.new}</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
