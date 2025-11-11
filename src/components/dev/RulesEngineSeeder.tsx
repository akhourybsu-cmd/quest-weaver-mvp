import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CLASS_FEATURE_SEEDS, FEAT_SEEDS } from "@/data/classFeatureSeeds";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Upload } from "lucide-react";

export const RulesEngineSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    classFeatures: number;
    feats: number;
    errors: string[];
  }>({ classFeatures: 0, feats: 0, errors: [] });

  const seedDatabase = async () => {
    setLoading(true);
    setStatus({ classFeatures: 0, feats: 0, errors: [] });
    const errors: string[] = [];

    try {
      // 1. Get class IDs
      const { data: classes, error: classError } = await supabase
        .from('srd_classes')
        .select('id, name');
      
      if (classError) throw classError;

      const classMap = new Map(classes?.map(c => [c.name, c.id]) || []);

      // 2. Seed Class Features
      let classFeatureCount = 0;
      for (const seed of CLASS_FEATURE_SEEDS) {
        const classId = classMap.get(seed.class_name);
        if (!classId) {
          errors.push(`Class not found: ${seed.class_name}`);
          continue;
        }

        const { error } = await supabase
          .from('class_features')
          .upsert({
            class_id: classId,
            level: seed.level,
            name: seed.name,
            description: seed.description,
            rules_json: seed.rules_json,
            choices_json: seed.choices_json || {},
            tags: seed.tags
          }, {
            onConflict: 'class_id,level,name',
            ignoreDuplicates: false
          });

        if (error) {
          errors.push(`Failed to seed ${seed.name}: ${error.message}`);
        } else {
          classFeatureCount++;
        }
      }

      // 3. Seed Feats
      let featCount = 0;
      for (const feat of FEAT_SEEDS) {
        const { error } = await supabase
          .from('srd_feats')
          .upsert({
            name: feat.name,
            description: feat.description,
            prerequisites: feat.prerequisites_json || {},
            ability_increases: feat.ability_increases || [],
            grants: feat.rules_json || {}
          }, {
            onConflict: 'name',
            ignoreDuplicates: false
          });

        if (error) {
          errors.push(`Failed to seed feat ${feat.name}: ${error.message}`);
        } else {
          featCount++;
        }
      }

      setStatus({
        classFeatures: classFeatureCount,
        feats: featCount,
        errors
      });

      if (errors.length === 0) {
        toast.success(`Seeded ${classFeatureCount} class features and ${featCount} feats!`);
      } else {
        toast.error(`Completed with ${errors.length} errors`);
      }
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Failed to seed database');
      errors.push(`Fatal error: ${error}`);
      setStatus(prev => ({ ...prev, errors }));
    } finally {
      setLoading(false);
    }
  };

  const validateSeeds = async () => {
    setLoading(true);
    try {
      const { data: features, error: featError } = await supabase
        .from('class_features')
        .select('id, class_id, level, name, tags');

      const { data: feats, error: featsError } = await supabase
        .from('srd_feats')
        .select('id, name, description');

      if (featError || featsError) {
        throw featError || featsError;
      }

      toast.success(`Found ${features?.length || 0} class features and ${feats?.length || 0} feats`);
      
      console.table(features?.slice(0, 10));
      console.table(feats);
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate seeds');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          <CardTitle>Rules Engine Seeder</CardTitle>
        </div>
        <CardDescription>
          Seed class features and feats for Phase 0 pilot (Fighter, Rogue, Cleric, Warlock, Sorcerer L1-5)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={seedDatabase} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Seeding..." : "Seed Database"}
          </Button>
          <Button 
            onClick={validateSeeds} 
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            Validate Seeds
          </Button>
        </div>

        {(status.classFeatures > 0 || status.feats > 0 || status.errors.length > 0) && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2">
              {status.errors.length === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-medium">Results</span>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="secondary">
                {status.classFeatures} Class Features
              </Badge>
              <Badge variant="secondary">
                {status.feats} Feats
              </Badge>
            </div>

            {status.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Errors:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {status.errors.map((error, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p className="font-medium mb-1">What gets seeded:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Fighter: L1-5 (Fighting Style, Second Wind, Action Surge, ASI, Extra Attack)</li>
            <li>Rogue: L1-5 (Expertise, Sneak Attack, Cunning Action, ASI, Uncanny Dodge)</li>
            <li>Cleric: L1-5 (Domain, Spellcasting, Channel Divinity, ASI)</li>
            <li>Warlock: L1-5 (Patron, Pact Magic, Invocations, Pact Boon, ASI)</li>
            <li>Sorcerer: L1-5 (Origin, Spellcasting, Font of Magic, Metamagic, ASI)</li>
            <li>Feats: Alert, Athlete, Tough, War Caster, Lucky, Resilient</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
