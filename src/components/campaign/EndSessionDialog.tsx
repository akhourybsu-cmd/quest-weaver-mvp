import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EndSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes?: string) => void;
  sessionDuration: string;
}

export function EndSessionDialog({
  open,
  onOpenChange,
  onConfirm,
  sessionDuration,
}: EndSessionDialogProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes || undefined);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End Session?</AlertDialogTitle>
          <AlertDialogDescription>
            This session has been running for {sessionDuration}. You can add optional notes before ending.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="session-notes">Session Notes (Optional)</Label>
          <Textarea
            id="session-notes"
            placeholder="Add notes about this session..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            End Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
