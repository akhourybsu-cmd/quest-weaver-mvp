import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ItemDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  itemName: string;
  onConfirm: (deleteFromInventories: boolean) => void;
}

interface HoldingData {
  id: string;
  owner_type: string;
  owner_id: string | null;
  quantity: number;
}

interface EnrichedHolding extends HoldingData {
  characterName?: string;
  npcName?: string;
}

const ItemDeleteDialog = ({ 
  open, 
  onOpenChange, 
  itemId, 
  itemName,
  onConfirm 
}: ItemDeleteDialogProps) => {
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [deleteFromInventories, setDeleteFromInventories] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && itemId) {
      loadHoldings();
    }
  }, [open, itemId]);

  const loadHoldings = async () => {
    if (!itemId) return;
    
    setLoading(true);
    const { data: holdingsData } = await supabase
      .from("holdings")
      .select("*")
      .eq("item_id", itemId);

    if (holdingsData) {
      // Fetch character and NPC names
      const enrichedHoldings: EnrichedHolding[] = await Promise.all(
        holdingsData.map(async (holding): Promise<EnrichedHolding> => {
          const enriched: EnrichedHolding = {
            id: holding.id,
            owner_type: holding.owner_type,
            owner_id: holding.owner_id,
            quantity: holding.quantity,
          };
          
          if (holding.owner_type === "CHARACTER" && holding.owner_id) {
            const { data: char } = await supabase
              .from("characters")
              .select("name")
              .eq("id", holding.owner_id)
              .single();
            enriched.characterName = char?.name;
          } else if (holding.owner_type === "NPC" && holding.owner_id) {
            const { data: npc } = await supabase
              .from("npcs")
              .select("name")
              .eq("id", holding.owner_id)
              .single();
            enriched.npcName = npc?.name;
          }
          
          return enriched;
        })
      );
      
      setHoldings(enrichedHoldings);
    }
    setLoading(false);
  };

  const handleConfirm = () => {
    onConfirm(deleteFromInventories);
    onOpenChange(false);
  };

  const getOwnerDisplay = (holding: EnrichedHolding) => {
    if (holding.owner_type === "PARTY") {
      return "Party Stash";
    } else if (holding.owner_type === "CHARACTER") {
      return holding.characterName || "Unknown Character";
    } else if (holding.owner_type === "NPC") {
      return holding.npcName || "Unknown NPC";
    }
    return "Unknown";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Item: {itemName}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {holdings.length > 0 ? (
                <>
                  <p className="text-sm">
                    This item exists in {holdings.length} inventory location(s):
                  </p>
                  
                  <ScrollArea className="max-h-[300px] rounded-md border p-4">
                    <div className="space-y-3">
                      {holdings.map((holding) => (
                        <div key={holding.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{holding.owner_type}</Badge>
                            <span className="font-medium">{getOwnerDisplay(holding)}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Qty: {holding.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox 
                      id="delete-holdings" 
                      checked={deleteFromInventories}
                      onCheckedChange={(checked) => setDeleteFromInventories(checked as boolean)}
                    />
                    <Label 
                      htmlFor="delete-holdings" 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Also delete this item from all inventories
                    </Label>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {deleteFromInventories 
                      ? "The item will be removed from the vault AND all player/party inventories."
                      : "The item will only be removed from the vault. Existing inventory copies will remain but cannot be replenished."}
                  </p>
                </>
              ) : (
                <p className="text-sm">
                  This item has not been distributed to any inventories. It will be permanently deleted from the vault.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete Item
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ItemDeleteDialog;
