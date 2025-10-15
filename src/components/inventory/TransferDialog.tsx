import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: any;
  campaignId: string;
  onSuccess: () => void;
}

const TransferDialog = ({
  open,
  onOpenChange,
  holding,
  campaignId,
  onSuccess,
}: TransferDialogProps) => {
  const { toast } = useToast();
  const [toOwnerType, setToOwnerType] = useState("PARTY");
  const [toOwnerId, setToOwnerId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [characters, setCharacters] = useState<any[]>([]);
  const [npcs, setNPCs] = useState<any[]>([]);

  useEffect(() => {
    if (open && campaignId) {
      loadEntities();
    }
  }, [open, campaignId]);

  const loadEntities = async () => {
    const { data: chars } = await supabase
      .from("characters")
      .select("id, name")
      .eq("campaign_id", campaignId);

    const { data: npcData } = await supabase
      .from("npcs")
      .select("id, name")
      .eq("campaign_id", campaignId);

    if (chars) setCharacters(chars);
    if (npcData) setNPCs(npcData);
  };

  const handleTransfer = async () => {
    const transferQty = parseFloat(quantity);
    if (isNaN(transferQty) || transferQty <= 0) {
      toast({
        title: "Invalid quantity",
        variant: "destructive",
      });
      return;
    }

    if (transferQty > Number(holding.quantity)) {
      toast({
        title: "Insufficient quantity",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update source holding
    const newSourceQty = Number(holding.quantity) - transferQty;
    if (newSourceQty > 0) {
      await supabase
        .from("holdings")
        .update({ quantity: newSourceQty })
        .eq("id", holding.id);
    } else {
      await supabase
        .from("holdings")
        .delete()
        .eq("id", holding.id);
    }

    // Create or update target holding
    const targetOwner = toOwnerType === "PARTY" ? null : toOwnerId;
    const { data: existingHolding } = await supabase
      .from("holdings")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("item_id", holding.item_id)
      .eq("owner_type", toOwnerType)
      .eq("owner_id", targetOwner)
      .maybeSingle();

    if (existingHolding) {
      await supabase
        .from("holdings")
        .update({ quantity: Number(existingHolding.quantity) + transferQty })
        .eq("id", existingHolding.id);
    } else {
      await supabase.from("holdings").insert({
        campaign_id: campaignId,
        item_id: holding.item_id,
        owner_type: toOwnerType,
        owner_id: targetOwner,
        quantity: transferQty,
      });
    }

    // Log event
    await supabase.from("holding_events").insert({
      campaign_id: campaignId,
      event_type: "TRADE",
      item_id: holding.item_id,
      from_owner_type: holding.owner_type,
      from_owner_id: holding.owner_id,
      to_owner_type: toOwnerType,
      to_owner_id: targetOwner,
      quantity_delta: transferQty,
      payload: { reason },
      author_id: user.id,
    });

    toast({ title: "Item transferred successfully" });
    onSuccess();
    onOpenChange(false);
    
    // Reset form
    setToOwnerType("PARTY");
    setToOwnerId("");
    setQuantity("1");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Item</DialogTitle>
          <DialogDescription>
            Transfer {holding?.items?.name} to another owner
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Transfer To</Label>
            <Select value={toOwnerType} onValueChange={setToOwnerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PARTY">Party Stash</SelectItem>
                <SelectItem value="CHARACTER">Character</SelectItem>
                <SelectItem value="NPC">NPC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {toOwnerType === "CHARACTER" && (
            <div className="space-y-2">
              <Label>Select Character</Label>
              <Select value={toOwnerId} onValueChange={setToOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a character" />
                </SelectTrigger>
                <SelectContent>
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id}>
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {toOwnerType === "NPC" && (
            <div className="space-y-2">
              <Label>Select NPC</Label>
              <Select value={toOwnerId} onValueChange={setToOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an NPC" />
                </SelectTrigger>
                <SelectContent>
                  {npcs.map((npc) => (
                    <SelectItem key={npc.id} value={npc.id}>
                      {npc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              max={Number(holding?.quantity)}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Available: {Number(holding?.quantity)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this item being transferred?"
              rows={2}
            />
          </div>

          <Button onClick={handleTransfer} className="w-full">
            Transfer Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferDialog;
