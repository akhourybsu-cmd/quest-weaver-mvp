import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DND_CLASSES,
  ABILITY_SCORES,
  calculateModifier,
  calculateProficiencyBonus,
  calculateLevel1HP,
  calculateBaseAC,
  calculateSavingThrow,
  isValidAbilityScore,
  getClassData,
} from "@/lib/dnd5e";

interface CharacterCreationDialogProps {
  open: boolean;
  campaignId: string;
  onComplete: () => void;
}

interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

const CharacterCreationDialog = ({ open, campaignId, onComplete }: CharacterCreationDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [level, setLevel] = useState(1);
  const [abilityScores, setAbilityScores] = useState<AbilityScores>({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });
  const [speed, setSpeed] = useState(30);
  const [loading, setLoading] = useState(false);

  const classData = selectedClass ? getClassData(selectedClass) : null;
  const proficiencyBonus = calculateProficiencyBonus(level);
  const maxHP = classData ? calculateLevel1HP(selectedClass, abilityScores.constitution) : 0;
  const baseAC = calculateBaseAC(abilityScores.dexterity);
  const passivePerception = 10 + calculateModifier(abilityScores.wisdom);

  const updateAbilityScore = (ability: keyof AbilityScores, value: string) => {
    const numValue = parseInt(value) || 10;
    if (isValidAbilityScore(numValue)) {
      setAbilityScores(prev => ({ ...prev, [ability]: numValue }));
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a character name",
        variant: "destructive",
      });
      return false;
    }

    if (!selectedClass) {
      toast({
        title: "Class required",
        description: "Please select a character class",
        variant: "destructive",
      });
      return false;
    }

    // Validate all ability scores
    const scores = Object.values(abilityScores);
    if (scores.some(score => !isValidAbilityScore(score))) {
      toast({
        title: "Invalid ability scores",
        description: "Ability scores must be between 1 and 20",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate saving throws based on class proficiencies
      const str_save = calculateSavingThrow(
        abilityScores.strength,
        classData?.saves.includes("str_save") || false,
        level
      );
      const dex_save = calculateSavingThrow(
        abilityScores.dexterity,
        classData?.saves.includes("dex_save") || false,
        level
      );
      const con_save = calculateSavingThrow(
        abilityScores.constitution,
        classData?.saves.includes("con_save") || false,
        level
      );
      const int_save = calculateSavingThrow(
        abilityScores.intelligence,
        classData?.saves.includes("int_save") || false,
        level
      );
      const wis_save = calculateSavingThrow(
        abilityScores.wisdom,
        classData?.saves.includes("wis_save") || false,
        level
      );
      const cha_save = calculateSavingThrow(
        abilityScores.charisma,
        classData?.saves.includes("cha_save") || false,
        level
      );

      // Calculate initiative bonus (usually dex modifier)
      const initiative_bonus = calculateModifier(abilityScores.dexterity);

      const { error } = await supabase.from("characters").insert({
        user_id: user.id,
        campaign_id: campaignId,
        name: name.trim(),
        class: selectedClass,
        level,
        max_hp: maxHP,
        current_hp: maxHP,
        temp_hp: 0,
        ac: baseAC,
        speed,
        proficiency_bonus: proficiencyBonus,
        passive_perception: passivePerception,
        str_save,
        dex_save,
        con_save,
        int_save,
        wis_save,
        cha_save,
        initiative_bonus,
        resistances: [],
        vulnerabilities: [],
        immunities: [],
      });

      if (error) throw error;

      toast({
        title: "Character created!",
        description: `${name} the ${selectedClass} is ready to adventure`,
      });

      onComplete();
    } catch (error) {
      console.error("Error creating character:", error);
      toast({
        title: "Error creating character",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Your Character</DialogTitle>
          <DialogDescription>
            Follow D&D 5E rules to create your adventurer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Character Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter character name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {DND_CLASSES.map((cls) => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.value} (d{cls.hitDie})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  max="20"
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed">Speed (ft)</Label>
              <Input
                id="speed"
                type="number"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value) || 30)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">
                Most races: 30 ft • Dwarves, Halflings: 25 ft • Wood Elves: 35 ft
              </p>
            </div>
          </div>

          <Separator />

          {/* Ability Scores */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Ability Scores</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Standard range: 8-15 before racial bonuses (Max 20)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {ABILITY_SCORES.map((ability) => {
                const score = abilityScores[ability.key as keyof AbilityScores];
                const modifier = calculateModifier(score);
                const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

                return (
                  <div key={ability.key} className="space-y-2">
                    <Label htmlFor={ability.key}>{ability.label}</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id={ability.key}
                        type="number"
                        min="1"
                        max="20"
                        value={score}
                        onChange={(e) => updateAbilityScore(ability.key as keyof AbilityScores, e.target.value)}
                        className="w-20"
                      />
                      <span className="text-sm font-mono text-muted-foreground">
                        ({modifierStr})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Calculated Stats */}
          {selectedClass && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3">Calculated Stats (5E Rules)</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Hit Points:</span>
                    <span className="ml-2 font-bold">{maxHP}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Armor Class:</span>
                    <span className="ml-2 font-bold">{baseAC}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Proficiency Bonus:</span>
                    <span className="ml-2 font-bold">+{proficiencyBonus}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Passive Perception:</span>
                    <span className="ml-2 font-bold">{passivePerception}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">
                    Proficient Saves: {classData?.saves.map(s => s.replace("_save", "").toUpperCase()).join(", ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={loading || !name || !selectedClass}
            className="w-full"
            size="lg"
          >
            {loading ? "Creating..." : "Create Character"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterCreationDialog;
