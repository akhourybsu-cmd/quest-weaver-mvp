import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import HitDiceManager from "./HitDiceManager";

interface RestManagerProps {
  characterId: string;
  character: {
    hit_dice_current: number;
    hit_dice_total: number;
    hit_die: string;
    current_hp: number;
    max_hp: number;
    level: number;
    con_save: number;
  };
}

const RestManager = ({ characterId, character }: RestManagerProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleShortRest = async () => {
    setLoading(true);
    try {
      // Fetch current character data including resources
      const { data: charData, error: fetchError } = await supabase
        .from('characters')
        .select('resources')
        .eq('id', characterId)
        .single();

      if (fetchError) throw fetchError;

      // Restore all resources with recharge: 'short'
      const resources = (charData?.resources as Record<string, any>) || {};
      const updatedResources = { ...resources };
      
      Object.entries(updatedResources).forEach(([key, value]: [string, any]) => {
        if (value && typeof value === 'object' && value.recharge === 'short') {
          updatedResources[key] = {
            ...value,
            current: value.max || 0,
          };
        }
      });

      // Update character with restored resources
      const { error: updateError } = await supabase
        .from('characters')
        .update({ resources: updatedResources })
        .eq('id', characterId);

      if (updateError) throw updateError;

      const restoredCount = Object.values(updatedResources).filter(
        (r: any) => r?.recharge === 'short'
      ).length;
      
      toast({
        title: "Short Rest Complete",
        description: `${restoredCount} resource(s) restored. Use hit dice to regain HP.`,
      });
    } catch (error) {
      console.error('Error during short rest:', error);
      toast({
        title: "Error",
        description: "Failed to complete short rest",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLongRest = async () => {
    setLoading(true);
    try {
      // Fetch current character data including resources
      const { data: charData, error: fetchError } = await supabase
        .from('characters')
        .select('resources')
        .eq('id', characterId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate hit dice restoration (half, minimum 1)
      const hdRestored = Math.max(1, Math.floor(character.hit_dice_total / 2));
      const newHitDice = Math.min(
        character.hit_dice_current + hdRestored,
        character.hit_dice_total
      );

      // Restore all resources with recharge: 'short' or 'long'
      // This includes spell slots, class features, etc.
      const resources = (charData?.resources as Record<string, any>) || {};
      const updatedResources = { ...resources };
      
      Object.entries(updatedResources).forEach(([key, value]: [string, any]) => {
        if (value && typeof value === 'object') {
          if (value.recharge === 'short' || value.recharge === 'long') {
            updatedResources[key] = {
              ...value,
              current: value.max || 0,
            };
          }
        }
      });

      const { error } = await supabase
        .from('characters')
        .update({
          current_hp: character.max_hp,
          temp_hp: 0,
          death_save_success: 0,
          death_save_fail: 0,
          hit_dice_current: newHitDice,
          resources: updatedResources,
        })
        .eq('id', characterId);

      if (error) throw error;

      const restoredCount = Object.values(updatedResources).filter(
        (r: any) => r?.recharge === 'short' || r?.recharge === 'long'
      ).length;

      toast({
        title: "Long Rest Complete",
        description: `HP fully restored. Regained ${hdRestored} hit dice and ${restoredCount} resource(s).`,
      });
    } catch (error) {
      console.error('Error during long rest:', error);
      toast({
        title: "Error",
        description: "Failed to complete long rest",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHeal = (amount: number) => {
    // Callback for when hit dice heal the character
    toast({
      title: "HP Restored",
      description: `Gained ${amount} HP`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rest & Recovery</CardTitle>
        <CardDescription>
          Manage your character's rest and hit dice
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="short" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="short">
              <Sun className="w-4 h-4 mr-2" />
              Short Rest
            </TabsTrigger>
            <TabsTrigger value="long">
              <Moon className="w-4 h-4 mr-2" />
              Long Rest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="short" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              A short rest is 1 hour. You can spend hit dice to regain HP.
            </div>

            <HitDiceManager
              characterId={characterId}
              character={character}
              onHeal={handleHeal}
            />

            <Button
              onClick={handleShortRest}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sun className="w-4 h-4 mr-2" />
              )}
              Complete Short Rest
            </Button>
          </TabsContent>

          <TabsContent value="long" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>A long rest is 8 hours of sleep. At the end:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Restore all HP</li>
                <li>Restore half your hit dice (min 1)</li>
                <li>Clear death saves</li>
                <li>Restore all spell slots and abilities</li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">HP Recovery:</span>
                <span className="font-medium">{character.max_hp - character.current_hp} HP</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hit Dice Recovery:</span>
                <span className="font-medium">
                  {Math.max(1, Math.floor(character.hit_dice_total / 2))} {character.hit_die}
                </span>
              </div>
            </div>

            <Button
              onClick={handleLongRest}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Moon className="w-4 h-4 mr-2" />
              )}
              Complete Long Rest
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RestManager;
