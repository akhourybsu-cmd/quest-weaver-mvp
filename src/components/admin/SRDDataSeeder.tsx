import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CLASS_FEATURES_SRD } from "@/data/srd/classFeaturesSeed";
import { SUBCLASSES_SRD, SUBCLASS_FEATURES_SRD } from "@/data/srd/subclassesSeed";
import { SUBANCESTRIES_SRD } from "@/data/srd/subancestriesSeed";
import { TOOLS_SRD } from "@/data/srd/toolsSeed";
import { Loader2, Database, CheckCircle } from "lucide-react";

export const SRDDataSeeder = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  const seedClassFeatures = async () => {
    setLoading("class_features");
    try {
      // Get all classes to map names to IDs
      const { data: classes } = await supabase.from("srd_classes").select("id, name");
      if (!classes) throw new Error("No classes found");

      const classMap = new Map(classes.map(c => [c.name, c.id]));

      // Prepare features with class_id
      const features = CLASS_FEATURES_SRD.map(f => ({
        class_id: classMap.get(f.class_name),
        level: f.level,
        name: f.name,
        description: f.description,
        choices: f.choices ? f.choices : null,
      })).filter(f => f.class_id);

      // Insert in batches
      for (let i = 0; i < features.length; i += 50) {
        const batch = features.slice(i, i + 50);
        const { error } = await supabase.from("srd_class_features").insert(batch);
        if (error) throw error;
      }

      setCompleted(prev => [...prev, "class_features"]);
      toast({ title: "Success", description: `Seeded ${features.length} class features` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const seedSubclasses = async () => {
    setLoading("subclasses");
    try {
      const { data: classes } = await supabase.from("srd_classes").select("id, name");
      if (!classes) throw new Error("No classes found");

      const classMap = new Map(classes.map(c => [c.name, c.id]));

      // Insert subclasses
      const subclasses = SUBCLASSES_SRD.map(s => ({
        class_id: classMap.get(s.class_name),
        name: s.name,
        unlock_level: s.unlock_level,
        features: [],
      })).filter(s => s.class_id);

      const { data: insertedSubclasses, error: subError } = await supabase
        .from("srd_subclasses")
        .insert(subclasses)
        .select();

      if (subError) throw subError;

      // Now insert subclass features
      const subclassMap = new Map(insertedSubclasses?.map(s => [`${s.name}`, s.id]) || []);

      const subclassFeatures = SUBCLASS_FEATURES_SRD.map(f => ({
        subclass_id: subclassMap.get(f.subclass_name),
        level: f.level,
        name: f.name,
        description: f.description,
        choices: null,
      })).filter(f => f.subclass_id);

      if (subclassFeatures.length > 0) {
        const { error: featError } = await supabase.from("srd_subclass_features").insert(subclassFeatures);
        if (featError) throw featError;
      }

      setCompleted(prev => [...prev, "subclasses"]);
      toast({ title: "Success", description: `Seeded ${subclasses.length} subclasses and ${subclassFeatures.length} features` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const seedSubancestries = async () => {
    setLoading("subancestries");
    try {
      const { data: ancestries } = await supabase.from("srd_ancestries").select("id, name");
      if (!ancestries) throw new Error("No ancestries found");

      const ancestryMap = new Map(ancestries.map(a => [a.name, a.id]));

      const subancestries = SUBANCESTRIES_SRD.map(s => ({
        ancestry_id: ancestryMap.get(s.ancestry_name),
        name: s.name,
        ability_bonuses: s.ability_bonuses,
        traits: s.traits,
        options: {},
      })).filter(s => s.ancestry_id);

      const { error } = await supabase.from("srd_subancestries").insert(subancestries);
      if (error) throw error;

      setCompleted(prev => [...prev, "subancestries"]);
      toast({ title: "Success", description: `Seeded ${subancestries.length} subancestries` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const seedTools = async () => {
    setLoading("tools");
    try {
      const tools = TOOLS_SRD.map(t => ({
        name: t.name,
        category: t.category,
        cost_gp: t.cost_gp,
      }));

      const { error } = await supabase.from("srd_tools").insert(tools);
      if (error) throw error;

      setCompleted(prev => [...prev, "tools"]);
      toast({ title: "Success", description: `Seeded ${tools.length} tools` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const seedAll = async () => {
    await seedClassFeatures();
    await seedSubclasses();
    await seedSubancestries();
    await seedTools();
  };

  const isCompleted = (key: string) => completed.includes(key);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          SRD Data Seeder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Seed missing D&D 5E SRD data into the database for the character wizard.
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={seedClassFeatures} 
            disabled={loading !== null}
            variant={isCompleted("class_features") ? "secondary" : "default"}
          >
            {loading === "class_features" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCompleted("class_features") && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
            Class Features
          </Button>
          
          <Button 
            onClick={seedSubclasses} 
            disabled={loading !== null}
            variant={isCompleted("subclasses") ? "secondary" : "default"}
          >
            {loading === "subclasses" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCompleted("subclasses") && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
            Subclasses
          </Button>
          
          <Button 
            onClick={seedSubancestries} 
            disabled={loading !== null}
            variant={isCompleted("subancestries") ? "secondary" : "default"}
          >
            {loading === "subancestries" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCompleted("subancestries") && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
            Subancestries
          </Button>
          
          <Button 
            onClick={seedTools} 
            disabled={loading !== null}
            variant={isCompleted("tools") ? "secondary" : "default"}
          >
            {loading === "tools" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCompleted("tools") && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
            Tools
          </Button>
        </div>

        <Button onClick={seedAll} disabled={loading !== null} className="w-full" variant="outline">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Seed All Missing Data
        </Button>
      </CardContent>
    </Card>
  );
};
