import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Sparkles, ArrowRightLeft, Trash2 } from "lucide-react";
import TransferDialog from "./TransferDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ItemCardProps {
  holding: any;
  campaignId: string;
  onUpdate: () => void;
  currentCharacterId: string | null;
}

const rarityColors = {
  Common: "bg-zinc-500",
  Uncommon: "bg-green-500",
  Rare: "bg-blue-500",
  "Very Rare": "bg-purple-500",
  Legendary: "bg-orange-500",
  Artifact: "bg-red-500",
};

const ItemCard = ({ holding, campaignId, onUpdate, currentCharacterId }: ItemCardProps) => {
  const [transferOpen, setTransferOpen] = useState(false);
  const { toast } = useToast();

  const handleAttune = async () => {
    if (!currentCharacterId) {
      toast({
        title: "No character",
        description: "You need a character to attune items",
        variant: "destructive",
      });
      return;
    }

    // Check attunement limit
    const { data: attunedItems } = await supabase
      .from("holdings")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("attuned_to", currentCharacterId)
      .eq("is_attuned", true);

    if (attunedItems && attunedItems.length >= 3) {
      toast({
        title: "Attunement limit reached",
        description: "You can only be attuned to 3 items at once",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("holdings")
      .update({
        is_attuned: true,
        attuned_to: currentCharacterId,
      })
      .eq("id", holding.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Log event
    await supabase.from("holding_events").insert({
      campaign_id: campaignId,
      event_type: "ATTUNE",
      item_id: holding.item_id,
      to_owner_type: holding.owner_type,
      to_owner_id: holding.owner_id,
      quantity_delta: 0,
      author_id: (await supabase.auth.getUser()).data.user?.id,
    });

    toast({ title: "Item attuned" });
    onUpdate();
  };

  const handleDetune = async () => {
    const { error } = await supabase
      .from("holdings")
      .update({
        is_attuned: false,
        attuned_to: null,
      })
      .eq("id", holding.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Log event
    await supabase.from("holding_events").insert({
      campaign_id: campaignId,
      event_type: "DETUNE",
      item_id: holding.item_id,
      from_owner_type: holding.owner_type,
      from_owner_id: holding.owner_id,
      quantity_delta: 0,
      author_id: (await supabase.auth.getUser()).data.user?.id,
    });

    toast({ title: "Item un-attuned" });
    onUpdate();
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("holdings")
      .delete()
      .eq("id", holding.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Log event
    await supabase.from("holding_events").insert({
      campaign_id: campaignId,
      event_type: "DESTROY",
      item_id: holding.item_id,
      from_owner_type: holding.owner_type,
      from_owner_id: holding.owner_id,
      quantity_delta: -Number(holding.quantity),
      author_id: (await supabase.auth.getUser()).data.user?.id,
    });

    toast({ title: "Item removed" });
    onUpdate();
  };

  const item = holding.items;
  const requiresAttunement = item.properties?.requiresAttunement;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {item.name}
                {holding.is_attuned && (
                  <Sparkles className="w-4 h-4 text-accent" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{item.type}</Badge>
                {item.rarity && (
                  <Badge
                    className={`${rarityColors[item.rarity as keyof typeof rarityColors]} text-white`}
                  >
                    {item.rarity}
                  </Badge>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTransferOpen(true)}>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Transfer
                </DropdownMenuItem>
                {requiresAttunement && !holding.is_attuned && (
                  <DropdownMenuItem onClick={handleAttune}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Attune
                  </DropdownMenuItem>
                )}
                {holding.is_attuned && (
                  <DropdownMenuItem onClick={handleDetune}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Un-attune
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-medium">{Number(holding.quantity)}</span>
          </div>
          
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}

          {requiresAttunement && (
            <Badge variant="outline" className="text-xs">
              Requires Attunement
            </Badge>
          )}

          {item.properties?.charges && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Charges:</span>
              <span className="font-medium">
                {item.properties.charges.current} / {item.properties.charges.max}
              </span>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {holding.notes && (
            <p className="text-xs text-muted-foreground italic">{holding.notes}</p>
          )}
        </CardContent>
      </Card>

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        holding={holding}
        campaignId={campaignId}
        onSuccess={onUpdate}
      />
    </>
  );
};

export default ItemCard;
