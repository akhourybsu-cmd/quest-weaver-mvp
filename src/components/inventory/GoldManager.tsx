import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins, Plus, Minus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface GoldManagerProps {
  campaignId: string;
  onUpdate: () => void;
}

const GoldManager = ({ campaignId, onUpdate }: GoldManagerProps) => {
  const { toast } = useToast();
  const [characters, setCharacters] = useState<any[]>([]);
  const [partyGold, setPartyGold] = useState(0);
  const [amount, setAmount] = useState("");
  const [targetType, setTargetType] = useState<"party" | "character">("party");
  const [targetCharacterId, setTargetCharacterId] = useState("");
  const [coinType, setCoinType] = useState("gp");

  const coinValues: Record<string, number> = {
    cp: 0.01,
    sp: 0.1,
    ep: 0.5,
    gp: 1,
    pp: 10,
  };

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    // Load characters
    const { data: chars } = await supabase
      .from("characters")
      .select("id, name, class")
      .eq("campaign_id", campaignId);

    if (chars) setCharacters(chars);

    // Calculate party gold
    const { data: partyHoldings } = await supabase
      .from("holdings")
      .select(`
        quantity,
        items!inner (name, type)
      `)
      .eq("campaign_id", campaignId)
      .eq("owner_type", "PARTY")
      .eq("items.type", "CURRENCY")
      .ilike("items.name", "%gold%");

    if (partyHoldings) {
      const total = partyHoldings.reduce((sum, h) => sum + Number(h.quantity), 0);
      setPartyGold(total);
    }
  };

  const getCharacterGold = async (characterId: string) => {
    const { data } = await supabase
      .from("holdings")
      .select(`
        quantity,
        items!inner (name, type)
      `)
      .eq("campaign_id", campaignId)
      .eq("owner_type", "CHARACTER")
      .eq("owner_id", characterId)
      .eq("items.type", "CURRENCY")
      .ilike("items.name", "%gold%");

    if (!data) return 0;
    return data.reduce((sum, h) => sum + Number(h.quantity), 0);
  };

  const handleAwardGold = async () => {
    const goldAmount = parseFloat(amount);
    if (isNaN(goldAmount) || goldAmount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const gpEquivalent = goldAmount * coinValues[coinType];

    try {
      // Find or create gold item
      let { data: goldItem } = await supabase
        .from("items")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("type", "CURRENCY")
        .ilike("name", "Gold%")
        .single();

      if (!goldItem) {
        const { data: newItem } = await supabase
          .from("items")
          .insert({
            campaign_id: campaignId,
            name: "Gold Pieces",
            type: "CURRENCY",
            description: "Standard currency",
            properties: {},
            tags: ["currency"],
          })
          .select()
          .single();
        goldItem = newItem;
      }

      if (!goldItem) return;

      // Add to party or character
      const ownerId = targetType === "party" ? null : targetCharacterId;
      const ownerType = targetType === "party" ? "PARTY" : "CHARACTER";

      const { data: existingHolding } = await supabase
        .from("holdings")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("item_id", goldItem.id)
        .eq("owner_type", ownerType)
        .eq("owner_id", ownerId)
        .maybeSingle();

      if (existingHolding) {
        await supabase
          .from("holdings")
          .update({ quantity: Number(existingHolding.quantity) + gpEquivalent })
          .eq("id", existingHolding.id);
      } else {
        await supabase.from("holdings").insert({
          campaign_id: campaignId,
          item_id: goldItem.id,
          owner_type: ownerType,
          owner_id: ownerId,
          quantity: gpEquivalent,
        });
      }

      // Log event
      await supabase.from("holding_events").insert({
        campaign_id: campaignId,
        event_type: "CREATE",
        item_id: goldItem.id,
        to_owner_type: ownerType,
        to_owner_id: ownerId,
        quantity_delta: gpEquivalent,
        payload: { reason: `DM awarded ${amount} ${coinType}` },
        author_id: user.id,
      });

      toast({ title: `Awarded ${amount} ${coinType}` });
      setAmount("");
      loadData();
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({ title: "Error awarding gold", variant: "destructive" });
    }
  };

  const handleDeductGold = async () => {
    const goldAmount = parseFloat(amount);
    if (isNaN(goldAmount) || goldAmount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const gpEquivalent = goldAmount * coinValues[coinType];

    try {
      const { data: goldItem } = await supabase
        .from("items")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("type", "CURRENCY")
        .ilike("name", "Gold%")
        .single();

      if (!goldItem) {
        toast({ title: "No gold to deduct", variant: "destructive" });
        return;
      }

      const ownerId = targetType === "party" ? null : targetCharacterId;
      const ownerType = targetType === "party" ? "PARTY" : "CHARACTER";

      const { data: existingHolding } = await supabase
        .from("holdings")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("item_id", goldItem.id)
        .eq("owner_type", ownerType)
        .eq("owner_id", ownerId)
        .single();

      if (!existingHolding || Number(existingHolding.quantity) < gpEquivalent) {
        toast({ title: "Insufficient gold", variant: "destructive" });
        return;
      }

      const newQty = Number(existingHolding.quantity) - gpEquivalent;

      if (newQty > 0) {
        await supabase
          .from("holdings")
          .update({ quantity: newQty })
          .eq("id", existingHolding.id);
      } else {
        await supabase
          .from("holdings")
          .delete()
          .eq("id", existingHolding.id);
      }

      // Log event
      await supabase.from("holding_events").insert({
        campaign_id: campaignId,
        event_type: "DESTROY",
        item_id: goldItem.id,
        from_owner_type: ownerType,
        from_owner_id: ownerId,
        quantity_delta: -gpEquivalent,
        payload: { reason: `DM deducted ${amount} ${coinType}` },
        author_id: user.id,
      });

      toast({ title: `Deducted ${amount} ${coinType}` });
      setAmount("");
      loadData();
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({ title: "Error deducting gold", variant: "destructive" });
    }
  };

  const handleSplitEvenly = async () => {
    if (partyGold === 0) {
      toast({ title: "No party gold to split", variant: "destructive" });
      return;
    }

    if (characters.length === 0) {
      toast({ title: "No characters to split gold to", variant: "destructive" });
      return;
    }

    const perPlayer = Math.floor(partyGold / characters.length);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data: goldItem } = await supabase
        .from("items")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("type", "CURRENCY")
        .ilike("name", "Gold%")
        .single();

      if (!goldItem) return;

      // Remove from party
      await supabase
        .from("holdings")
        .delete()
        .eq("campaign_id", campaignId)
        .eq("item_id", goldItem.id)
        .eq("owner_type", "PARTY")
        .is("owner_id", null);

      // Add to each character
      for (const char of characters) {
        const { data: existing } = await supabase
          .from("holdings")
          .select("*")
          .eq("campaign_id", campaignId)
          .eq("item_id", goldItem.id)
          .eq("owner_type", "CHARACTER")
          .eq("owner_id", char.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("holdings")
            .update({ quantity: Number(existing.quantity) + perPlayer })
            .eq("id", existing.id);
        } else {
          await supabase.from("holdings").insert({
            campaign_id: campaignId,
            item_id: goldItem.id,
            owner_type: "CHARACTER",
            owner_id: char.id,
            quantity: perPlayer,
          });
        }

        await supabase.from("holding_events").insert({
          campaign_id: campaignId,
          event_type: "TRADE",
          item_id: goldItem.id,
          from_owner_type: "PARTY",
          to_owner_type: "CHARACTER",
          to_owner_id: char.id,
          quantity_delta: perPlayer,
          payload: { reason: "Party gold split evenly" },
          author_id: user.id,
        });
      }

      toast({ title: `Split ${perPlayer} gp to each player` });
      loadData();
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({ title: "Error splitting gold", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-status-warning" />
            Gold Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Party Treasury</p>
              <p className="text-2xl font-bold">{partyGold.toLocaleString()} gp</p>
            </div>
            <Button onClick={handleSplitEvenly} variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Split Evenly
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target</Label>
              <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="party">Party</SelectItem>
                  <SelectItem value="character">Character</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetType === "character" && (
              <div className="space-y-2">
                <Label>Select Character</Label>
                <Select value={targetCharacterId} onValueChange={setTargetCharacterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a character" />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map((char) => (
                      <SelectItem key={char.id} value={char.id}>
                        {char.name} ({char.class})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label>Coin Type</Label>
              <Select value={coinType} onValueChange={setCoinType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cp">Copper (cp)</SelectItem>
                  <SelectItem value="sp">Silver (sp)</SelectItem>
                  <SelectItem value="ep">Electrum (ep)</SelectItem>
                  <SelectItem value="gp">Gold (gp)</SelectItem>
                  <SelectItem value="pp">Platinum (pp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAwardGold} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Award
            </Button>
            <Button onClick={handleDeductGold} variant="destructive" className="flex-1">
              <Minus className="w-4 h-4 mr-2" />
              Deduct
            </Button>
          </div>

          {coinType !== "gp" && (
            <p className="text-xs text-muted-foreground text-center">
              ≈ {(parseFloat(amount) * coinValues[coinType]).toFixed(2)} gp equivalent
            </p>
          )}
        </CardContent>
      </Card>

      {/* Character Gold Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {characters.map((char) => (
          <Card key={char.id}>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="font-medium text-sm truncate">{char.name}</p>
                <p className="text-xs text-muted-foreground">{char.class}</p>
                <CharacterGoldBadge characterId={char.id} campaignId={campaignId} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const CharacterGoldBadge = ({ characterId, campaignId }: { characterId: string; campaignId: string }) => {
  const [gold, setGold] = useState(0);

  useEffect(() => {
    const loadGold = async () => {
      const { data } = await supabase
        .from("holdings")
        .select(`
          quantity,
          items!inner (name, type)
        `)
        .eq("campaign_id", campaignId)
        .eq("owner_type", "CHARACTER")
        .eq("owner_id", characterId)
        .eq("items.type", "CURRENCY")
        .ilike("items.name", "%gold%");

      if (data) {
        const total = data.reduce((sum, h) => sum + Number(h.quantity), 0);
        setGold(total);
      }
    };

    loadGold();
  }, [characterId, campaignId]);

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Coins className="w-3 h-3 text-status-warning" />
      {gold.toLocaleString()} gp
    </Badge>
  );
};

export default GoldManager;
