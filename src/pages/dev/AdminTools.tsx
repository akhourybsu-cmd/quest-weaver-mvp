import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Shield, Database, Sparkles, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CLASS_FEATURES_SRD } from "@/data/srd/classFeaturesSeed";
import { SUBCLASSES_SRD, SUBCLASS_FEATURES_SRD } from "@/data/srd/subclassesSeed";
import { SUBANCESTRIES_SRD } from "@/data/srd/subancestriesSeed";
import { TOOLS_SRD } from "@/data/srd/toolsSeed";

interface SRDStats {
  classFeatures: number;
  subclasses: number;
  subclassFeatures: number;
  subancestries: number;
  tools: number;
  spells: number;
  spellsWithClasses: number;
}

const AdminTools = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isDM, setIsDM] = useState(false);
  const [stats, setStats] = useState<SRDStats | null>(null);
  const [seeding, setSeeding] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("dm_user_id", user.id)
        .limit(1);

      setIsDM(campaigns && campaigns.length > 0);
      setLoading(false);
      
      await refreshStats();
    };

    checkAccess();
  }, []);

  const refreshStats = async () => {
    const [
      classFeatures,
      subclasses,
      subclassFeatures,
      subancestries,
      tools,
      spells
    ] = await Promise.all([
      supabase.from("srd_class_features").select("id", { count: "exact", head: true }),
      supabase.from("srd_subclasses").select("id", { count: "exact", head: true }),
      supabase.from("srd_subclass_features").select("id", { count: "exact", head: true }),
      supabase.from("srd_subancestries").select("id", { count: "exact", head: true }),
      supabase.from("srd_tools").select("id", { count: "exact", head: true }),
      supabase.from("srd_spells").select("id, classes, level")
    ]);

    const spellsWithClasses = spells.data?.filter(s => 
      Array.isArray(s.classes) && s.classes.length > 0 && s.level > 0
    ).length || 0;

    setStats({
      classFeatures: classFeatures.count || 0,
      subclasses: subclasses.count || 0,
      subclassFeatures: subclassFeatures.count || 0,
      subancestries: subancestries.count || 0,
      tools: tools.count || 0,
      spells: spells.data?.length || 0,
      spellsWithClasses
    });
  };

  const seedClassFeatures = async () => {
    setSeeding(prev => ({ ...prev, classFeatures: true }));
    try {
      // Get class IDs
      const { data: classes } = await supabase.from("srd_classes").select("id, name");
      if (!classes?.length) throw new Error("No classes found - seed classes first");

      const classMap = new Map(classes.map(c => [c.name, c.id]));
      
      // Clear existing and insert
      await supabase.from("srd_class_features").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const features = CLASS_FEATURES_SRD.map(f => ({
        class_id: classMap.get(f.class_name),
        name: f.name,
        level: f.level,
        description: f.description,
        choices: f.choices || []
      })).filter(f => f.class_id);

      const { error } = await supabase.from("srd_class_features").insert(features);
      if (error) throw error;

      toast({ title: "Success", description: `Seeded ${features.length} class features` });
      await refreshStats();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to seed", variant: "destructive" });
    } finally {
      setSeeding(prev => ({ ...prev, classFeatures: false }));
    }
  };

  const seedSubclasses = async () => {
    setSeeding(prev => ({ ...prev, subclasses: true }));
    try {
      const { data: classes } = await supabase.from("srd_classes").select("id, name");
      if (!classes?.length) throw new Error("No classes found - seed classes first");

      const classMap = new Map(classes.map(c => [c.name, c.id]));
      
      // Clear existing
      await supabase.from("srd_subclass_features").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("srd_subclasses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // Insert subclasses
      const subclasses = SUBCLASSES_SRD.map(s => ({
        class_id: classMap.get(s.class_name),
        name: s.name,
        unlock_level: s.unlock_level,
        description: s.description
      })).filter(s => s.class_id);

      const { data: insertedSubclasses, error: subclassError } = await supabase
        .from("srd_subclasses")
        .insert(subclasses)
        .select("id, name");
      
      if (subclassError) throw subclassError;

      // Insert subclass features
      const subclassMap = new Map(insertedSubclasses?.map(s => [s.name, s.id]) || []);
      
      const features = SUBCLASS_FEATURES_SRD.map(f => {
        const subclassId = subclassMap.get(f.subclass_name);
        return subclassId ? {
          subclass_id: subclassId,
          name: f.name,
          level: f.level,
          description: f.description
        } : null;
      }).filter(Boolean);

      if (features.length > 0) {
        const { error: featureError } = await supabase.from("srd_subclass_features").insert(features);
        if (featureError) throw featureError;
      }

      toast({ title: "Success", description: `Seeded ${subclasses.length} subclasses and ${features.length} features` });
      await refreshStats();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to seed", variant: "destructive" });
    } finally {
      setSeeding(prev => ({ ...prev, subclasses: false }));
    }
  };

  const seedSubancestries = async () => {
    setSeeding(prev => ({ ...prev, subancestries: true }));
    try {
      const { data: ancestries } = await supabase.from("srd_ancestries").select("id, name");
      if (!ancestries?.length) throw new Error("No ancestries found");

      const ancestryMap = new Map(ancestries.map(a => [a.name, a.id]));
      
      await supabase.from("srd_subancestries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const subancestries = SUBANCESTRIES_SRD.map(s => ({
        ancestry_id: ancestryMap.get(s.ancestry_name),
        name: s.name,
        traits: s.traits
      })).filter(s => s.ancestry_id);

      const { error } = await supabase.from("srd_subancestries").insert(subancestries);
      if (error) throw error;

      toast({ title: "Success", description: `Seeded ${subancestries.length} subancestries` });
      await refreshStats();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to seed", variant: "destructive" });
    } finally {
      setSeeding(prev => ({ ...prev, subancestries: false }));
    }
  };

  const seedTools = async () => {
    setSeeding(prev => ({ ...prev, tools: true }));
    try {
      await supabase.from("srd_tools").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const { error } = await supabase.from("srd_tools").insert(TOOLS_SRD);
      if (error) throw error;

      toast({ title: "Success", description: `Seeded ${TOOLS_SRD.length} tools` });
      await refreshStats();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to seed", variant: "destructive" });
    } finally {
      setSeeding(prev => ({ ...prev, tools: false }));
    }
  };

  const fixSpells = async () => {
    setSeeding(prev => ({ ...prev, spells: true }));
    try {
      const { data, error } = await supabase.functions.invoke("import-srd-core", {
        body: { categories: ["spells"] }
      });
      
      if (error) throw error;
      
      toast({
        title: "Spell Import Started",
        description: "Spells are being re-imported. This may take a minute.",
      });
      
      setTimeout(async () => {
        await refreshStats();
        setSeeding(prev => ({ ...prev, spells: false }));
      }, 5000);
    } catch (error) {
      toast({ title: "Import Failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
      setSeeding(prev => ({ ...prev, spells: false }));
    }
  };

  const seedAll = async () => {
    setSeeding(prev => ({ ...prev, all: true }));
    try {
      await seedClassFeatures();
      await seedSubclasses();
      await seedSubancestries();
      await seedTools();
      await fixSpells();
      toast({ title: "All SRD Data Seeded", description: "All data has been seeded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Some seeding operations failed", variant: "destructive" });
    } finally {
      setSeeding(prev => ({ ...prev, all: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isDM) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You need to be a DM to access admin tools.</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusBadge = ({ current, expected, label }: { current: number; expected: number; label: string }) => {
    const isGood = current >= expected * 0.8;
    return (
      <div className="flex items-center gap-2 text-sm">
        {isGood ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        <span>{label}: {current}/{expected}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Admin Tools - SRD Data Manager</h1>
          <Button variant="outline" size="sm" onClick={refreshStats} className="ml-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              SRD Data Status
            </CardTitle>
            <CardDescription>Current state of D&D 5E reference data</CardDescription>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatusBadge current={stats.classFeatures} expected={200} label="Class Features" />
                <StatusBadge current={stats.subclasses} expected={12} label="Subclasses" />
                <StatusBadge current={stats.subclassFeatures} expected={50} label="Subclass Features" />
                <StatusBadge current={stats.subancestries} expected={8} label="Subancestries" />
                <StatusBadge current={stats.tools} expected={17} label="Tools" />
                <StatusBadge current={stats.spellsWithClasses} expected={300} label="Spells w/ Classes" />
              </div>
            )}
            <Button 
              onClick={seedAll} 
              disabled={seeding.all}
              className="w-full mt-4"
            >
              {seeding.all ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Seeding All Data...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Seed All Missing SRD Data</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Individual Seeders */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Class Features</CardTitle>
              <CardDescription>Features for all 12 classes (levels 1-20)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Current: {stats?.classFeatures || 0} / ~200 expected
              </p>
              <Button 
                onClick={seedClassFeatures} 
                disabled={seeding.classFeatures}
                variant="outline"
                className="w-full"
              >
                {seeding.classFeatures ? <Loader2 className="h-4 w-4 animate-spin" /> : "Seed Class Features"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Subclasses</CardTitle>
              <CardDescription>12 SRD subclasses with features</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Current: {stats?.subclasses || 0} subclasses, {stats?.subclassFeatures || 0} features
              </p>
              <Button 
                onClick={seedSubclasses} 
                disabled={seeding.subclasses}
                variant="outline"
                className="w-full"
              >
                {seeding.subclasses ? <Loader2 className="h-4 w-4 animate-spin" /> : "Seed Subclasses"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Subancestries</CardTitle>
              <CardDescription>Subraces like Hill Dwarf, High Elf</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Current: {stats?.subancestries || 0} / ~8 expected
              </p>
              <Button 
                onClick={seedSubancestries} 
                disabled={seeding.subancestries}
                variant="outline"
                className="w-full"
              >
                {seeding.subancestries ? <Loader2 className="h-4 w-4 animate-spin" /> : "Seed Subancestries"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tools</CardTitle>
              <CardDescription>Artisan tools, gaming sets, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Current: {stats?.tools || 0} / 17 expected
              </p>
              <Button 
                onClick={seedTools} 
                disabled={seeding.tools}
                variant="outline"
                className="w-full"
              >
                {seeding.tools ? <Loader2 className="h-4 w-4 animate-spin" /> : "Seed Tools"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Spell Data
              </CardTitle>
              <CardDescription>Fix spell class assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {stats?.spellsWithClasses || 0}/{stats?.spells || 0} spells have class data
              </p>
              <Button 
                onClick={fixSpells} 
                disabled={seeding.spells}
                variant={stats && stats.spellsWithClasses < stats.spells * 0.5 ? "default" : "outline"}
                className="w-full"
              >
                {seeding.spells ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fix Spell Data"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminTools;