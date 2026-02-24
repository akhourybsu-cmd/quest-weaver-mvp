import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Character {
  id: string;
  name: string;
}

interface TokenManagerProps {
  mapId: string;
  campaignId: string;
  encounterId?: string;
  gridSize: number;
  gridSnapEnabled?: boolean;
  getViewportCenter?: () => { x: number; y: number };
}

const TOKEN_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
];

const TOKEN_SIZES = [
  { value: 1, label: "Medium (1x1)" },
  { value: 2, label: "Large (2x2)" },
  { value: 3, label: "Huge (3x3)" },
  { value: 4, label: "Gargantuan (4x4)" },
];

const TokenManager = ({ mapId, campaignId, encounterId, gridSize, gridSnapEnabled = true, getViewportCenter }: TokenManagerProps) => {
  const [open, setOpen] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [name, setName] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [color, setColor] = useState(TOKEN_COLORS[0].value);
  const [size, setSize] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadCharacters = async () => {
      const { data } = await supabase
        .from("characters")
        .select("id, name")
        .eq("campaign_id", campaignId);

      if (data) setCharacters(data);
    };

    loadCharacters();
  }, [campaignId]);

  const handleAddToken = async () => {
    if (!name && !selectedCharacterId) {
      toast({
        title: "Missing information",
        description: "Please provide a token name or select a character.",
        variant: "destructive",
      });
      return;
    }

    const tokenName = name || characters.find((c) => c.id === selectedCharacterId)?.name || "Token";

    // Place token at viewport center
    const center = getViewportCenter ? getViewportCenter() : { x: 300, y: 200 };
    let x = center.x;
    let y = center.y;
    
    if (gridSnapEnabled) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    const { error } = await supabase.from("tokens").insert({
      map_id: mapId,
      encounter_id: encounterId,
      character_id: selectedCharacterId || null,
      name: tokenName,
      x,
      y,
      size,
      color,
      is_visible: isVisible,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Token added!",
      description: `${tokenName} placed on map.`,
    });

    setOpen(false);
    setName("");
    setSelectedCharacterId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Token
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Token to Map</DialogTitle>
          <DialogDescription>
            Place a character or creature token on the battle map.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="character-select">Link to Character (Optional)</Label>
            <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
              <SelectTrigger id="character-select">
                <SelectValue placeholder="None - custom token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None - custom token</SelectItem>
                {characters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedCharacterId && (
            <div className="space-y-2">
              <Label htmlFor="token-name">Token Name</Label>
              <Input
                id="token-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Goblin Warrior"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="token-color">Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger id="token-color">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: c.value }}
                      />
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-size">Size</Label>
            <Select value={size.toString()} onValueChange={(v) => setSize(parseInt(v))}>
              <SelectTrigger id="token-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_SIZES.map((s) => (
                  <SelectItem key={s.value} value={s.value.toString()}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="visible-toggle">Visible to Players</Label>
            <Switch
              id="visible-toggle"
              checked={isVisible}
              onCheckedChange={setIsVisible}
            />
          </div>

          <Button onClick={handleAddToken} className="w-full">
            Add Token
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenManager;
