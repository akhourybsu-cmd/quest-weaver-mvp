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
  spells: boolean;
}

export function useSRDAutoSeed() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedComplete, setSeedComplete] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState<string>("");
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
        { data: spellsData },
      ] = await Promise.all([
        supabase.from("srd_class_features").select("*", { count: "exact", head: true }),
        supabase.from("srd_subclasses").select("*", { count: "exact", head: true }),
        supabase.from("srd_subancestries").select("*", { count: "exact", head: true }),
        supabase.from("srd_tools").select("*", { count: "exact", head: true }),
        supabase.from("srd_spells").select("id, classes, level").limit(100),
      ]);

      // Check if spells have proper class assignments
      const spellsWithClasses = spellsData?.filter(s => 
        Array.isArray(s.classes) && s.classes.length > 0 && s.level > 0
      ).length || 0;
      const spellsNeedFix = spellsData && spellsData.length > 0 && spellsWithClasses < spellsData.length * 0.5;

      const needsSeeding: SeedStatus = {
        classFeatures: (featuresCount || 0) === 0,
        subclasses: (subclassCount || 0) === 0,
        subancestries: (subancestryCount || 0) === 0,
        tools: (toolsCount || 0) === 0,
        spells: spellsNeedFix,
      };

      const anyNeedsSeeding = Object.values(needsSeeding).some(v => v);

      if (!anyNeedsSeeding) {
        setSeedComplete(true);
        return;
      }

      setIsSeeding(true);

      // Seed in order (some depend on others)
      if (needsSeeding.classFeatures) {
        setSeedingStatus("Seeding class features...");
        await seedClassFeatures();
      }

      if (needsSeeding.subclasses) {
        setSeedingStatus("Seeding subclasses...");
        await seedSubclasses();
      }

      if (needsSeeding.subancestries) {
        setSeedingStatus("Seeding subancestries...");
        await seedSubancestries();
      }

      if (needsSeeding.tools) {
        setSeedingStatus("Seeding tools...");
        await seedTools();
      }

      if (needsSeeding.spells) {
        setSeedingStatus("Fixing spell data...");
        await fixSpellData();
      }

      setSeedComplete(true);
    } catch (error) {
      console.error("Error auto-seeding SRD data:", error);
      // Still mark as complete to not block the wizard
      setSeedComplete(true);
    } finally {
      setIsSeeding(false);
      setSeedingStatus("");
    }
  };

  const seedClassFeatures = async () => {
    try {
      const { data: classes } = await supabase.from("srd_classes").select("id, name");
      if (!classes?.length) {
        console.warn("No classes found - cannot seed class features");
        return;
      }

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
        const { error } = await supabase.from("srd_class_features").insert(batch);
        if (error) {
          console.error("Error inserting class features batch:", error);
        }
      }

      console.log(`Auto-seeded ${features.length} class features`);
    } catch (error) {
      console.error("Error seeding class features:", error);
    }
  };

  const seedSubclasses = async () => {
    try {
      const { data: classes } = await supabase.from("srd_classes").select("id, name");
      if (!classes?.length) {
        console.warn("No classes found - cannot seed subclasses");
        return;
      }

      const classMap = new Map(classes.map(c => [c.name, c.id]));

      const subclasses = SUBCLASSES_SRD.map(s => ({
        class_id: classMap.get(s.class_name),
        name: s.name,
        unlock_level: s.unlock_level,
        description: s.description,
      })).filter(s => s.class_id);

      const { data: insertedSubclasses, error: subError } = await supabase
        .from("srd_subclasses")
        .insert(subclasses)
        .select();

      if (subError) {
        console.error("Error inserting subclasses:", subError);
        return;
      }

      // Insert subclass features
      if (insertedSubclasses?.length) {
        const subclassMap = new Map(insertedSubclasses.map(s => [s.name, s.id]));

        const subclassFeatures = SUBCLASS_FEATURES_SRD.map(f => ({
          subclass_id: subclassMap.get(f.subclass_name),
          level: f.level,
          name: f.name,
          description: f.description,
        })).filter(f => f.subclass_id);

        if (subclassFeatures.length > 0) {
          const { error } = await supabase.from("srd_subclass_features").insert(subclassFeatures);
          if (error) {
            console.error("Error inserting subclass features:", error);
          }
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
      if (!ancestries?.length) {
        console.warn("No ancestries found - cannot seed subancestries");
        return;
      }

      const ancestryMap = new Map(ancestries.map(a => [a.name, a.id]));

      const subancestries = SUBANCESTRIES_SRD.map(s => ({
        ancestry_id: ancestryMap.get(s.ancestry_name),
        name: s.name,
        ability_bonuses: s.ability_bonuses,
        traits: s.traits,
      })).filter(s => s.ancestry_id);

      const { error } = await supabase.from("srd_subancestries").insert(subancestries);
      if (error) {
        console.error("Error inserting subancestries:", error);
        return;
      }

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

      const { error } = await supabase.from("srd_tools").insert(tools);
      if (error) {
        console.error("Error inserting tools:", error);
        return;
      }

      console.log(`Auto-seeded ${tools.length} tools`);
    } catch (error) {
      console.error("Error seeding tools:", error);
    }
  };

  const fixSpellData = async () => {
    try {
      // Call the edge function to re-import spells with proper class data
      const { error } = await supabase.functions.invoke("import-srd-core", {
        body: { categories: ["spells"] }
      });
      
      if (error) {
        console.error("Error fixing spell data:", error);
        return;
      }

      console.log("Spell data fix initiated");
    } catch (error) {
      console.error("Error fixing spell data:", error);
    }
  };

  return { isSeeding, seedComplete, seedingStatus };
}