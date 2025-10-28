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

interface ItemAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  campaignId: string;
  onSuccess: () => void;
}

const ItemAssignDialog = ({
  open,
  onOpenChange,
  item,
  campaignId,
  onSuccess,
}: ItemAssignDialogProps) => {
  const { toast } = useToast();
  const [ownerType, setOwnerType] = useState("PARTY");
  const [ownerId, setOwnerId] = useState<string>("");
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

  const handleAssign = async () => {
    const assignQty = parseFloat(quantity);
    if (isNaN(assignQty) || assignQty <= 0) {
      toast({
        title: "Invalid quantity",
        variant: "destructive",
      });
      return;
    }

    if (ownerType !== "PARTY" && !ownerId) {
      toast({
        title: "Please select a recipient",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const targetOwner = ownerType === "PARTY" ? null : ownerId;

    // Check if holding already exists
    let query = supabase
      .from("holdings")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("item_id", item.id)
      .eq("owner_type", ownerType);

    if (targetOwner === null) {
      query = query.is("owner_id", null);
    } else {
      query = query.eq("owner_id", targetOwner);
    }

    const { data: existingHolding } = await query.maybeSingle();

    if (existingHolding) {
      // Update existing holding
      await supabase
        .from("holdings")
        .update({ quantity: Number(existingHolding.quantity) + assignQty })
        .eq("id", existingHolding.id);
    } else {
      // Create new holding
      await supabase.from("holdings").insert({
        campaign_id: campaignId,
        item_id: item.id,
        owner_type: ownerType,
        owner_id: targetOwner,
        quantity: assignQty,
      });
    }

    // Log event
    await supabase.from("holding_events").insert({
      campaign_id: campaignId,
      event_type: "DM_AWARD",
      item_id: item.id,
      from_owner_type: null,
      from_owner_id: null,
      to_owner_type: ownerType,
      to_owner_id: targetOwner,
      quantity_delta: assignQty,
      payload: { reason: reason || "DM assigned from vault" },
      author_id: user.id,
    });

    toast({ title: "Item assigned successfully" });
    onSuccess();
    onOpenChange(false);
    
    // Reset form
    setOwnerType("PARTY");
    setOwnerId("");
    setQuantity("1");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Item</DialogTitle>
          <DialogDescription>
            Assign {item?.name} to a player or party stash
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={ownerType} onValueChange={setOwnerType}>
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

          {ownerType === "CHARACTER" && (
            <div className="space-y-2">
              <Label>Select Character</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
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

          {ownerType === "NPC" && (
            <div className="space-y-2">
              <Label>Select NPC</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
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
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this item being assigned?"
              rows={2}
            />
          </div>

          <Button onClick={handleAssign} className="w-full">
            Assign Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemAssignDialog;
