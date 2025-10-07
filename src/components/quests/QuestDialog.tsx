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
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

const QuestDialog = ({ open, onOpenChange, campaignId }: QuestDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [giver, setGiver] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const { toast } = useToast();

  const handleAddStep = () => {
    setSteps([...steps, ""]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleAdd = async () => {
    if (!title) {
      toast({
        title: "Missing information",
        description: "Please provide a quest title.",
        variant: "destructive",
      });
      return;
    }

    const { data: questData, error: questError } = await supabase
      .from("quests")
      .insert({
        campaign_id: campaignId,
        title,
        description,
        giver,
      })
      .select()
      .single();

    if (questError) {
      toast({
        title: "Error",
        description: questError.message,
        variant: "destructive",
      });
      return;
    }

    // Add steps
    const validSteps = steps.filter((s) => s.trim());
    if (validSteps.length > 0) {
      const stepsData = validSteps.map((text, index) => ({
        quest_id: questData.id,
        text,
        order_index: index,
      }));

      await supabase.from("quest_steps").insert(stepsData);
    }

    toast({
      title: "Quest added!",
      description: `${title} added to quest log.`,
    });

    setTitle("");
    setDescription("");
    setGiver("");
    setSteps([""]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Quest</DialogTitle>
          <DialogDescription>
            Create a new quest with objectives for the party.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quest-title">Quest Title</Label>
            <Input
              id="quest-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Missing Heirloom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A local noble has lost their family's ancient sword..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="giver">Quest Giver (Optional)</Label>
            <Input
              id="giver"
              value={giver}
              onChange={(e) => setGiver(e.target.value)}
              placeholder="Lord Harrington"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Objectives</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStep}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  placeholder={`Step ${index + 1}: e.g., Investigate the old tower`}
                />
                {steps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStep(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button onClick={handleAdd} className="w-full">
            Create Quest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestDialog;
