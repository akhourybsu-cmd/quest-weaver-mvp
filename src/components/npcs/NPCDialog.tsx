import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface NPCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

const NPCDialog = ({ open, onOpenChange, campaignId }: NPCDialogProps) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!name) {
      toast({
        title: "Missing information",
        description: "Please provide an NPC name.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("npcs").insert({
      campaign_id: campaignId,
      name,
      role,
      location,
      description,
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
      title: "NPC added!",
      description: `${name} added to directory.`,
    });

    setName("");
    setRole("");
    setLocation("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add NPC</DialogTitle>
          <DialogDescription>
            Add a notable character to your campaign.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="npc-name">Name</Label>
            <Input
              id="npc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Elara Moonwhisper"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Merchant, Quest Giver, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="The Rusty Dragon Inn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="npc-description">Description</Label>
            <Textarea
              id="npc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="An elderly elf with silver hair..."
              rows={3}
            />
          </div>
          <Button onClick={handleAdd} className="w-full">
            Add NPC
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NPCDialog;
