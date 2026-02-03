import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MapMarker } from "@/hooks/useMapOverlays";

interface NotePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pin?: MapMarker;
  position?: { x: number; y: number };
  onSave: (data: {
    label: string;
    metadata: { description: string };
    dm_only: boolean;
    x: number;
    y: number;
  }) => void;
}

export function NotePinDialog({
  open,
  onOpenChange,
  pin,
  position,
  onSave,
}: NotePinDialogProps) {
  const [label, setLabel] = useState(pin?.label || "");
  const [description, setDescription] = useState(
    (pin?.metadata as any)?.description || ""
  );
  const [dmOnly, setDmOnly] = useState(pin?.dm_only ?? true);

  const handleSave = () => {
    onSave({
      label,
      metadata: { description },
      dm_only: dmOnly,
      x: pin?.x ?? position?.x ?? 0,
      y: pin?.y ?? position?.y ?? 0,
    });
    onOpenChange(false);
    setLabel("");
    setDescription("");
    setDmOnly(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{pin ? "Edit Note Pin" : "Add Note Pin"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pin-label">Label</Label>
            <Input
              id="pin-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Secret Door, Treasure"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin-description">Description</Label>
            <Textarea
              id="pin-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this location..."
              rows={4}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="dm-only" className="text-sm">
              DM Only (hidden from players)
            </Label>
            <Switch
              id="dm-only"
              checked={dmOnly}
              onCheckedChange={setDmOnly}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Pin</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
