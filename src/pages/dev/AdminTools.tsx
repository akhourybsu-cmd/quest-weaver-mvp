import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Shield, Database, Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SRDDataSeeder } from "@/components/admin/SRDDataSeeder";
import { useToast } from "@/hooks/use-toast";

const AdminTools = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isDM, setIsDM] = useState(false);
  const [fixingSpells, setFixingSpells] = useState(false);
  const [spellStats, setSpellStats] = useState<{ total: number; withClasses: number } | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user is a DM of any campaign
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("dm_user_id", user.id)
        .limit(1);

      setIsDM(campaigns && campaigns.length > 0);
      setLoading(false);
      
      // Check spell data status
      checkSpellStatus();
    };

    checkAccess();
  }, []);

  const checkSpellStatus = async () => {
    const { data: spells, error } = await supabase
      .from("srd_spells")
      .select("id, classes, level");
    
    if (!error && spells) {
      const withClasses = spells.filter(s => 
        Array.isArray(s.classes) && s.classes.length > 0
      ).length;
      setSpellStats({ total: spells.length, withClasses });
    }
  };

  const handleFixSpells = async () => {
    setFixingSpells(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-srd-core", {
        body: { categories: ["spells"] }
      });
      
      if (error) throw error;
      
      toast({
        title: "Spell Import Started",
        description: "Spells are being re-imported in the background. This may take a minute.",
      });
      
      // Wait a bit then refresh stats
      setTimeout(() => {
        checkSpellStatus();
        setFixingSpells(false);
      }, 5000);
    } catch (error) {
      console.error("Failed to fix spells:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setFixingSpells(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking permissions...</p>
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
            <p className="text-muted-foreground mb-4">
              You need to be a DM to access admin tools.
            </p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const spellsNeedFix = spellStats && spellStats.withClasses < spellStats.total * 0.5;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Admin Tools</h1>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <SRDDataSeeder />
          
          {/* Spell Data Fixer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5" />
                Spell Data Status
              </CardTitle>
              <CardDescription>
                Fix spell class assignments for character creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {spellStats && (
                <div className="flex items-center gap-2">
                  {spellsNeedFix ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm">
                    {spellStats.withClasses}/{spellStats.total} spells have class assignments
                  </span>
                </div>
              )}
              
              {spellsNeedFix && (
                <p className="text-sm text-muted-foreground">
                  Many spells are missing class assignments. This prevents players from selecting spells during character creation.
                </p>
              )}
              
              <Button 
                onClick={handleFixSpells} 
                disabled={fixingSpells}
                variant={spellsNeedFix ? "default" : "outline"}
                className="w-full"
              >
                {fixingSpells ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Re-importing Spells...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    {spellsNeedFix ? "Fix Spell Data" : "Re-import Spells"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Database Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use the SRD Data Seeder to populate missing D&D 5E reference data.
                This data is required for the character creation wizard to function properly.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminTools;
