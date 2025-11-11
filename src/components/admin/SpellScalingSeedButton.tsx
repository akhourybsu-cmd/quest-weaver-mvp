import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database, Loader2 } from "lucide-react";
import { SPELL_SCALING_DATA } from "@/data/spellScalingData";

const SpellScalingSeedButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const seedSpellScaling = async () => {
    setLoading(true);
    try {
      let updated = 0;
      let notFound = 0;

      for (const scalingData of SPELL_SCALING_DATA) {
        // Try to find the spell in srd_spells
        const { data: spells } = await supabase
          .from('srd_spells')
          .select('id, name')
          .ilike('name', scalingData.spellName)
          .limit(1);

        if (spells && spells.length > 0) {
          const { error } = await supabase
            .from('srd_spells')
            .update({
              scaling_type: scalingData.scalingType,
              scaling_value: scalingData.scalingValue,
              scaling_description: scalingData.scalingDescription,
            })
            .eq('id', spells[0].id);

          if (error) {
            console.error(`Error updating ${scalingData.spellName}:`, error);
          } else {
            updated++;
          }
        } else {
          notFound++;
          console.log(`Spell not found: ${scalingData.spellName}`);
        }
      }

      toast({
        title: "Spell scaling data seeded",
        description: `Updated ${updated} spells. ${notFound} spells not found in database.`,
      });
    } catch (error) {
      console.error('Error seeding spell scaling:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed spell scaling",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={seedSpellScaling}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Database className="w-4 h-4 mr-2" />
      )}
      Seed Spell Scaling Data
    </Button>
  );
};

export default SpellScalingSeedButton;
