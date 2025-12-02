import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CLASS_FEATURES_SRD } from "@/data/srd/classFeaturesSeed";
import { SUBCLASSES_SRD, SUBCLASS_FEATURES_SRD } from "@/data/srd/subclassesSeed";
import { SUBANCESTRIES_SRD } from "@/data/srd/subancestriesSeed";
import { TOOLS_SRD } from "@/data/srd/toolsSeed";

interface SeedStatus {
  classFeatures: boolean;
  subclasses: boolean;
  subancestries: boolean;
  tools: boolean;
}

export function useSRDAutoSeed() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedComplete, setSeedComplete] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    
    checkAndSeedData();
  }, []);

  const checkAndSeedData = async () => {
    try {
      // Check what data exists
      const [
        { count: featuresCount },
        { count: subclassCount },
        { count: subancestryCount },
        { count: toolsCount },
      ] = await Promise.all([
        supabase.from("srd_class_features").select("*", { count: "exact", head: true }),
        supabase.from("srd_subclasses").select("*", { count: "exact", head: true }),
        supabase.from("srd_subancestries").select("*", { count: "exact", head: true }),
        supabase.from("srd_tools").select("*", { count: "exact", head: true }),
      ]);

      const needsSeeding: SeedStatus = {
        classFeatures: (featuresCount || 0) === 0,
        subclasses: (subclassCount || 0) === 0,
        subancestries: (subancestryCount || 0) === 0,
        tools: (toolsCount || 0) === 0,
      };

      const anyNeedsSeeding = Object.values(needsSeeding).some(v => v);

      if (!anyNeedsSeeding) {
        setSeedComplete(true);
        return;
      }

      setIsSeeding(true);

      // Seed in order (some depend on others)
      if (needsSeeding.classFeatures) {
        await seedClassFeatures();
      }

      if (needsSeeding.subclasses) {
        await seedSubclasses();
      }

      if (needsSeeding.subancestries) {
        await seedSubancestries();
      }

      if (needsSeeding.tools) {
        await seedTools();
      }

      setSeedComplete(true);
    } catch (error) {
      console.error("Error auto-seeding SRD data:", error);
      // Still mark as complete to not block the wizard
      setSeedComplete(true);
    } finally {
      setIsSeeding(false);
    }
  };

  const seedClassFeatures = async () => {
    try {
      const { data: classes } = await supabase.from("srd_classes").select("id, name");
      if (!classes?.length) return;

      const classMap = new Map(classes.map(c => [c.name, c.id]));

      const features = CLASS_FEATURES_SRD.map(f => ({
        class_id: classMap.get(f.class_name),
        level: f.level,
        name: f.name,
        description: f.description,
        choices: f.choices ? f.choices : null,
      })).filter(f => f.class_id);

      // Insert in batches to avoid timeout
      for (let i = 0; i < features.length; i += 50) {
        const batch = features.slice(i, i + 50);
        await supabase.from("srd_class_features").insert(batch);
      }

      console.log(`Auto-seeded ${features.length} class features`);
    } catch (error) {
      console.error("Error seeding class features:", error);
    }
  };

  const seedSubclasses = async () => {
    try {
      const { data: classes } = await supabase.from("srd_classes").select("id, name");
      if (!classes?.length) return;

      const classMap = new Map(classes.map(c => [c.name, c.id]));

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

      // Insert subclass features
      if (insertedSubclasses?.length) {
        const subclassMap = new Map(insertedSubclasses.map(s => [s.name, s.id]));

        const subclassFeatures = SUBCLASS_FEATURES_SRD.map(f => ({
          subclass_id: subclassMap.get(f.subclass_name),
          level: f.level,
          name: f.name,
          description: f.description,
          choices: null,
        })).filter(f => f.subclass_id);

        if (subclassFeatures.length > 0) {
          await supabase.from("srd_subclass_features").insert(subclassFeatures);
        }

        console.log(`Auto-seeded ${subclasses.length} subclasses and ${subclassFeatures.length} features`);
      }
    } catch (error) {
      console.error("Error seeding subclasses:", error);
    }
  };

  const seedSubancestries = async () => {
    try {
      const { data: ancestries } = await supabase.from("srd_ancestries").select("id, name");
      if (!ancestries?.length) return;

      const ancestryMap = new Map(ancestries.map(a => [a.name, a.id]));

      const subancestries = SUBANCESTRIES_SRD.map(s => ({
        ancestry_id: ancestryMap.get(s.ancestry_name),
        name: s.name,
        ability_bonuses: s.ability_bonuses,
        traits: s.traits,
        options: {},
      })).filter(s => s.ancestry_id);

      await supabase.from("srd_subancestries").insert(subancestries);

      console.log(`Auto-seeded ${subancestries.length} subancestries`);
    } catch (error) {
      console.error("Error seeding subancestries:", error);
    }
  };

  const seedTools = async () => {
    try {
      const tools = TOOLS_SRD.map(t => ({
        name: t.name,
        category: t.category,
        cost_gp: t.cost_gp,
      }));

      await supabase.from("srd_tools").insert(tools);

      console.log(`Auto-seeded ${tools.length} tools`);
    } catch (error) {
      console.error("Error seeding tools:", error);
    }
  };

  return { isSeeding, seedComplete };
}
