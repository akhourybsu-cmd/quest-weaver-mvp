import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Coins, Award, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  questToEdit?: any;
}

interface QuestStep {
  description: string;
  objectiveType: string;
  progressMax: number;
}

const QuestDialog = ({ open, onOpenChange, campaignId, questToEdit }: QuestDialogProps) => {
  const isEditing = !!questToEdit;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [giver, setGiver] = useState("");
  const [questType, setQuestType] = useState("side_quest");
  const [difficulty, setDifficulty] = useState<string>("");
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [rewardXP, setRewardXP] = useState("");
  const [rewardGP, setRewardGP] = useState("");
  const [dmNotes, setDmNotes] = useState("");
  const [steps, setSteps] = useState<QuestStep[]>([{ description: "", objectiveType: "other", progressMax: 1 }]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [factions, setFactions] = useState<any[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadCharactersAndFactions();
      if (questToEdit) {
        // Populate form with existing quest data
        setTitle(questToEdit.title || "");
        setDescription(questToEdit.description || "");
        setGiver(questToEdit.questGiver || "");
        setQuestType(questToEdit.questType || "side_quest");
        setDifficulty(questToEdit.difficulty || "");
        setLocations(questToEdit.locations || []);
        setTags(questToEdit.tags || []);
        setRewardXP(questToEdit.rewardXP?.toString() || "");
        setRewardGP(questToEdit.rewardGP?.toString() || "");
        setDmNotes(questToEdit.dmNotes || "");
        setSelectedCharacters(questToEdit.assignedTo || []);
        setSelectedFaction(questToEdit.factionId || "");
        setSteps(questToEdit.steps?.map((s: any) => ({
          id: s.id,
          description: s.description,
          objectiveType: s.objectiveType,
          progressMax: s.progressMax,
        })) || [{ description: "", objectiveType: "other", progressMax: 1 }]);
      }
    }
  }, [open, campaignId, questToEdit]);

  const loadCharactersAndFactions = async () => {
    const { data: chars } = await supabase
      .from("characters")
      .select("id, name")
      .eq("campaign_id", campaignId);
    
    const { data: facts } = await supabase
      .from("factions")
      .select("id, name")
      .eq("campaign_id", campaignId);
    
    if (chars) setCharacters(chars);
    if (facts) setFactions(facts);
  };

  const handleAddStep = () => {
    setSteps([...steps, { description: "", objectiveType: "other", progressMax: 1 }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: keyof QuestStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addLocation = () => {
    if (locationInput.trim() && !locations.includes(locationInput.trim())) {
      setLocations([...locations, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const removeLocation = (location: string) => {
    setLocations(locations.filter(l => l !== location));
  };

  const toggleCharacter = (charId: string) => {
    setSelectedCharacters(prev =>
      prev.includes(charId) ? prev.filter(id => id !== charId) : [...prev, charId]
    );
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

    if (isEditing) {
      // Update existing quest
      const { error: questError } = await supabase
        .from("quests")
        .update({
          title,
          description,
          quest_giver: giver,
          quest_type: questType,
          difficulty: difficulty || null,
          locations,
          tags,
          reward_xp: rewardXP ? parseInt(rewardXP) : 0,
          reward_gp: rewardGP ? parseFloat(rewardGP) : 0,
          assigned_to: selectedCharacters,
          faction_id: selectedFaction || null,
          dm_notes: dmNotes || null,
        })
        .eq("id", questToEdit.id);

      if (questError) {
        toast({
          title: "Error",
          description: questError.message,
          variant: "destructive",
        });
        return;
      }

      // Delete existing steps and recreate them
      await supabase.from("quest_steps").delete().eq("quest_id", questToEdit.id);

      const validSteps = steps.filter((s) => s.description.trim());
      if (validSteps.length > 0) {
        const stepsData = validSteps.map((step, index) => ({
          quest_id: questToEdit.id,
          description: step.description,
          objective_type: step.objectiveType,
          progress_max: step.progressMax,
          step_order: index,
        }));

        await supabase.from("quest_steps").insert(stepsData);
      }

      toast({
        title: "Quest updated!",
        description: `${title} has been updated.`,
      });
    } else {
      // Create new quest
      const { data: questData, error: questError } = await supabase
        .from("quests")
        .insert({
          campaign_id: campaignId,
          title,
          description,
          quest_giver: giver,
          quest_type: questType,
          difficulty: difficulty || null,
          locations,
          tags,
          reward_xp: rewardXP ? parseInt(rewardXP) : 0,
          reward_gp: rewardGP ? parseFloat(rewardGP) : 0,
          assigned_to: selectedCharacters,
          faction_id: selectedFaction || null,
          dm_notes: dmNotes || null,
          status: 'not_started',
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
      const validSteps = steps.filter((s) => s.description.trim());
      if (validSteps.length > 0) {
        const stepsData = validSteps.map((step, index) => ({
          quest_id: questData.id,
          description: step.description,
          objective_type: step.objectiveType,
          progress_max: step.progressMax,
          step_order: index,
        }));

        await supabase.from("quest_steps").insert(stepsData);
      }

      toast({
        title: "Quest added!",
        description: `${title} added to quest log.`,
      });
    }


    setTitle("");
    setDescription("");
    setGiver("");
    setQuestType("side_quest");
    setDifficulty("");
    setLocations([]);
    setTags([]);
    setRewardXP("");
    setRewardGP("");
    setDmNotes("");
    setSelectedCharacters([]);
    setSelectedFaction("");
    setSteps([{ description: "", objectiveType: "other", progressMax: 1 }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Quest" : "Create Quest"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update quest details, objectives, rewards, and assignments." : "Create a comprehensive quest with objectives, rewards, and assignments."}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="basics" className="space-y-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quest-title">Quest Title *</Label>
                  <Input
                    id="quest-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="The Missing Heirloom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quest-type">Quest Type</Label>
                  <Select value={questType} onValueChange={setQuestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main_quest">Main Quest</SelectItem>
                      <SelectItem value="side_quest">Side Quest</SelectItem>
                      <SelectItem value="faction">Faction Quest</SelectItem>
                      <SelectItem value="personal">Personal Quest</SelectItem>
                      <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="giver">Quest Giver</Label>
                  <Input
                    id="giver"
                    value={giver}
                    onChange={(e) => setGiver(e.target.value)}
                    placeholder="Lord Harrington"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="deadly">Deadly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Locations</Label>
                <div className="flex gap-2">
                  <Input
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                    placeholder="Add location..."
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {locations.map(loc => (
                    <div key={loc} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm">
                      {loc}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeLocation(loc)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm">
                      {tag}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-4 px-1">
              <div className="flex items-center justify-between">
                <Label>Quest Objectives</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Objective
                </Button>
              </div>
              
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <Input
                        value={step.description}
                        onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                        placeholder={`Objective ${index + 1}: e.g., Investigate the old tower`}
                        className="flex-1"
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
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select 
                          value={step.objectiveType} 
                          onValueChange={(val) => handleStepChange(index, 'objectiveType', val)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exploration">Exploration</SelectItem>
                            <SelectItem value="combat">Combat</SelectItem>
                            <SelectItem value="fetch">Fetch</SelectItem>
                            <SelectItem value="escort">Escort</SelectItem>
                            <SelectItem value="puzzle">Puzzle</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Progress Goal</Label>
                        <Input
                          type="number"
                          min="1"
                          value={step.progressMax}
                          onChange={(e) => handleStepChange(index, 'progressMax', parseInt(e.target.value) || 1)}
                          className="h-9"
                          placeholder="1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward-xp" className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Experience Points
                  </Label>
                  <Input
                    id="reward-xp"
                    type="number"
                    value={rewardXP}
                    onChange={(e) => setRewardXP(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reward-gp" className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Gold Pieces
                  </Label>
                  <Input
                    id="reward-gp"
                    type="number"
                    step="0.01"
                    value={rewardGP}
                    onChange={(e) => setRewardGP(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Item Rewards
                </Label>
                <p className="text-sm text-muted-foreground">
                  Item rewards can be assigned from the DM Item Vault when the quest is completed.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 px-1">
              {characters.length > 0 && (
                <div className="space-y-2">
                  <Label>Assign to Characters</Label>
                  <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                    {characters.map(char => (
                      <div key={char.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`char-${char.id}`}
                          checked={selectedCharacters.includes(char.id)}
                          onCheckedChange={() => toggleCharacter(char.id)}
                        />
                        <Label htmlFor={`char-${char.id}`} className="cursor-pointer font-normal">
                          {char.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {factions.length > 0 && (
                <div className="space-y-2">
                  <Label>Associated Faction</Label>
                  <Select value={selectedFaction} onValueChange={setSelectedFaction}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {factions.map(faction => (
                        <SelectItem key={faction.id} value={faction.id}>
                          {faction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dm-notes">DM Notes (Hidden from Players)</Label>
                <Textarea
                  id="dm-notes"
                  value={dmNotes}
                  onChange={(e) => setDmNotes(e.target.value)}
                  placeholder="Behind-the-scenes notes, secrets, or plot hooks..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </ScrollArea>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAdd} className="flex-1">
              {isEditing ? "Update Quest" : "Create Quest"}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default QuestDialog;
