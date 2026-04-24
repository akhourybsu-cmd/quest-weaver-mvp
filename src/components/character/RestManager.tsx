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
    class?: string;
  };
  onUpdate?: () => void;
}

const RestManager = ({ characterId, character, onUpdate }: RestManagerProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleShortRest = async () => {
    setLoading(true);
    try {
      // Restore all short-rest resources from character_resources
      const { data: resources, error: fetchError } = await supabase
        .from('character_resources')
        .select('id, max_value')
        .eq('character_id', characterId)
        .eq('recharge', 'short');

      if (fetchError) throw fetchError;

      let restoredCount = 0;
      if (resources && resources.length > 0) {
        await Promise.all(
          resources.map(r =>
            supabase
              .from('character_resources')
              .update({ current_value: r.max_value })
              .eq('id', r.id)
          )
        );
        restoredCount = resources.length;
      }

      // SRD: Warlock pact magic slots recharge on a SHORT rest
      const isWarlock = character.class?.toLowerCase().includes('warlock');
      let pactRestored = 0;
      if (isWarlock) {
        const { error: pactErr } = await supabase
          .from('characters')
          .update({ pact_slots_used: 0 })
          .eq('id', characterId);
        if (pactErr) throw pactErr;
        pactRestored = 1;
      }

      toast({
        title: "Short Rest Complete",
        description: `${restoredCount} resource(s) restored${pactRestored ? ' and pact slots refilled' : ''}. Use hit dice to regain HP.`,
      });
      onUpdate?.();
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
      // Calculate hit dice restoration (half, minimum 1)
      const hdRestored = Math.max(1, Math.floor(character.hit_dice_total / 2));
      const newHitDice = Math.min(
        character.hit_dice_current + hdRestored,
        character.hit_dice_total
      );

      // SRD: long rest restores short, long, AND daily-recharge resources
      const { data: resources, error: fetchResourcesError } = await supabase
        .from('character_resources')
        .select('id, max_value')
        .eq('character_id', characterId)
        .in('recharge', ['short', 'long', 'daily']);

      if (fetchResourcesError) throw fetchResourcesError;

      let restoredCount = 0;
      if (resources && resources.length > 0) {
        await Promise.all(
          resources.map(r =>
            supabase
              .from('character_resources')
              .update({ current_value: r.max_value })
              .eq('id', r.id)
          )
        );
        restoredCount = resources.length;
      }

      // BUG FIX: Reset spell slots on long rest
      const { error: spellSlotError } = await supabase
        .from('character_spell_slots')
        .update({ used_slots: 0 })
        .eq('character_id', characterId);

      if (spellSlotError) throw spellSlotError;

      // Long rest also clears exhaustion by 1 level (SRD), refills luck points,
      // and resets Mystic Arcanum / pact slots.
      const { error: characterError } = await supabase
        .from('characters')
        .update({
          current_hp: character.max_hp,
          temp_hp: 0,
          death_save_success: 0,
          death_save_fail: 0,
          hit_dice_current: newHitDice,
          pact_slots_used: 0,
          luck_points_used: 0,
          mystic_arcanum_6_used: false,
          mystic_arcanum_7_used: false,
          mystic_arcanum_8_used: false,
          mystic_arcanum_9_used: false,
        })
        .eq('id', characterId);

      if (characterError) throw characterError;

      toast({
        title: "Long Rest Complete",
        description: `HP fully restored. Regained ${hdRestored} hit dice, ${restoredCount} resource(s), and all spell slots.`,
      });
      onUpdate?.();
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

  const handleHeal = (amount: number, _newHp: number, _newHitDice: number) => {
    // Callback for when hit dice heal the character
    toast({
      title: "HP Restored",
      description: `Gained ${amount} HP`,
    });
    onUpdate?.();
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
