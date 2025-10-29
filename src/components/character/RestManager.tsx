import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { calculateModifier } from "@/lib/dnd5e";

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  current_hp: number;
  max_hp: number;
  con_save: number;
}

interface RestManagerProps {
  character: Character;
}

const RestManager = ({ character }: RestManagerProps) => {
  const [isResting, setIsResting] = useState(false);
  const { toast } = useToast();

  const rollHitDie = (dieSize: number) => {
    return Math.floor(Math.random() * dieSize) + 1;
  };

  const getHitDieSize = (className: string): number => {
    const hitDice: { [key: string]: number } = {
      Barbarian: 12,
      Fighter: 10,
      Paladin: 10,
      Ranger: 10,
      Bard: 8,
      Cleric: 8,
      Druid: 8,
      Monk: 8,
      Rogue: 8,
      Warlock: 8,
      Sorcerer: 6,
      Wizard: 6,
    };
    return hitDice[className] || 8;
  };

  const handleShortRest = async () => {
    setIsResting(true);

    // Roll hit die for healing
    const hitDieSize = getHitDieSize(character.class);
    const hitDieRoll = rollHitDie(hitDieSize);
    const conModifier = calculateModifier(character.con_save);
    const healing = Math.max(1, hitDieRoll + conModifier); // Minimum 1 HP

    const newHP = Math.min(character.max_hp, character.current_hp + healing);

    // Get current resources to restore short rest resources
    const { data: charData } = await supabase
      .from("characters")
      .select("resources")
      .eq("id", character.id)
      .single();

    const currentResources = (charData?.resources as any) || { spellSlots: [], classResources: [] };
    const updatedResources = { ...currentResources };

    // Restore short-rest class resources
    if (updatedResources.classResources) {
      updatedResources.classResources = updatedResources.classResources.map((resource: any) => ({
        ...resource,
        used: resource.resetOn === "short" ? 0 : resource.used,
      }));
    }
    
    const { error } = await supabase
      .from("characters")
      .update({ 
        current_hp: newHP,
        temp_hp: 0,
        resources: updatedResources as any
      })
      .eq("id", character.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Short Rest Complete",
        description: `Rolled 1d${hitDieSize} + ${conModifier} = ${healing} HP. Short rest resources restored!`,
      });
    }

    setIsResting(false);
  };

  const handleLongRest = async () => {
    setIsResting(true);

    // Get current resources to fully restore them
    const { data: charData } = await supabase
      .from("characters")
      .select("resources")
      .eq("id", character.id)
      .single();

    const currentResources = (charData?.resources as any) || { spellSlots: [], classResources: [] };
    const restoredResources = { ...currentResources };

    // Restore all spell slots
    if (restoredResources.spellSlots) {
      restoredResources.spellSlots = restoredResources.spellSlots.map((slot: any) => ({
        ...slot,
        used: 0,
      }));
    }

    // Restore all class resources (both short and long rest)
    if (restoredResources.classResources) {
      restoredResources.classResources = restoredResources.classResources.map((resource: any) => ({
        ...resource,
        used: 0,
      }));
    }

    // Long rest: Full HP recovery, all resources, clear death saves
    const { error } = await supabase
      .from("characters")
      .update({ 
        current_hp: character.max_hp,
        temp_hp: 0,
        death_save_success: 0,
        death_save_fail: 0,
        resources: restoredResources as any,
        action_used: false,
        bonus_action_used: false,
        reaction_used: false
      })
      .eq("id", character.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Long Rest Complete",
        description: `Fully restored! HP, spell slots, class resources, and actions reset.`,
        duration: 5000,
      });
    }

    setIsResting(false);
  };

  const hitDieSize = getHitDieSize(character.class);
  const conModifier = calculateModifier(character.con_save);
  const hpMissing = character.max_hp - character.current_hp;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="w-5 h-5 text-status-hp" />
          Rest & Recovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hpMissing === 0 && (
          <Badge variant="outline" className="w-full justify-center py-2 text-status-buff">
            At Full Health
          </Badge>
        )}

        {hpMissing > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Missing {hpMissing} HP
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Short Rest */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto flex-col py-4">
                <Sun className="w-6 h-6 mb-2 text-status-warning" />
                <span className="font-semibold">Short Rest</span>
                <span className="text-xs text-muted-foreground mt-1">
                  1 hour
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Short Rest</DialogTitle>
                <DialogDescription>
                  Spend 1 hour resting to recover some HP.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-semibold">What you'll recover:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Roll 1 Hit Die (1d{hitDieSize})</li>
                    <li>• Add CON modifier (+{conModifier})</li>
                    <li>• Regain that much HP</li>
                    <li>• Temporary HP removed</li>
                  </ul>
                </div>
                <Button
                  onClick={handleShortRest}
                  disabled={isResting}
                  className="w-full"
                >
                  {isResting ? "Resting..." : "Take Short Rest"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Long Rest */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto flex-col py-4">
                <Moon className="w-6 h-6 mb-2 text-primary" />
                <span className="font-semibold">Long Rest</span>
                <span className="text-xs text-muted-foreground mt-1">
                  8 hours
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Long Rest</DialogTitle>
                <DialogDescription>
                  Spend 8 hours sleeping or performing light activity.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-semibold">What you'll recover:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Full HP restoration</li>
                    <li>• All Hit Dice recovered</li>
                    <li>• All spell slots restored</li>
                    <li>• Class features recharged</li>
                    <li>• Temporary HP removed</li>
                  </ul>
                </div>
                <Button
                  onClick={handleLongRest}
                  disabled={isResting}
                  className="w-full"
                >
                  {isResting ? "Resting..." : "Take Long Rest"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default RestManager;
