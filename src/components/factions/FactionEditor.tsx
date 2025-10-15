import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Faction {
  id: string;
  name: string;
  description?: string;
  motto?: string;
  banner_url?: string;
  influence_score: number;
  tags: string[];
}

interface FactionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  faction: Faction | null;
  onSaved: () => void;
}

const FactionEditor = ({ open, onOpenChange, campaignId, faction, onSaved }: FactionEditorProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [motto, setMotto] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (faction) {
      setName(faction.name);
      setDescription(faction.description || "");
      setMotto(faction.motto || "");
      setTags(faction.tags || []);
    } else {
      setName("");
      setDescription("");
      setMotto("");
      setTags([]);
    }
  }, [faction, open]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the faction",
        variant: "destructive",
      });
      return;
    }

    try {
      const factionData = {
        campaign_id: campaignId,
        name: name.trim(),
        description: description.trim() || null,
        motto: motto.trim() || null,
        tags,
      };

      if (faction) {
        const { error } = await supabase
          .from("factions")
          .update(factionData)
          .eq("id", faction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("factions").insert(factionData);
        if (error) throw error;
      }

      toast({
        title: faction ? "Faction updated" : "Faction created",
        description: `${name} has been ${faction ? "updated" : "created"} successfully`,
      });

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving faction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{faction ? "Edit Faction" : "New Faction"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Faction name"
            />
          </div>

          <div>
            <Label htmlFor="motto">Motto</Label>
            <Input
              id="motto"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Their rallying cry or motto..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this faction about?"
              className="min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type and press Enter..."
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {faction ? "Save Changes" : "Create Faction"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FactionEditor;
