import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Database, CheckCircle, RefreshCw } from "lucide-react";

const IMPORT_CATEGORIES = [
  { key: "languages", label: "Languages" },
  { key: "classes", label: "Classes & Subclasses" },
  { key: "ancestries", label: "Ancestries & Subancestries" },
  { key: "backgrounds", label: "Backgrounds" },
  { key: "armor", label: "Armor" },
  { key: "weapons", label: "Weapons" },
  { key: "spells", label: "Spells" },
  { key: "feats", label: "Feats" },
  { key: "conditions", label: "Conditions" },
  { key: "magic_items", label: "Magic Items" },
  { key: "monsters", label: "Monsters" },
];

export const SRDDataSeeder = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  const triggerImport = async (categories: string[], label: string) => {
    setLoading(label);
    try {
      const { error } = await supabase.functions.invoke("import-srd-core", {
        body: { categories },
      });

      if (error) throw error;

      setCompleted((prev) => [...prev, label]);
      toast({
        title: "Import Started",
        description: `${label} import is running in the background. Check edge function logs for progress.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const importAll = () => triggerImport([], "All SRD Data");

  const importCategory = (key: string, label: string) =>
    triggerImport([key], label);

  const isCompleted = (key: string) => completed.includes(key);
  const isLoading = loading !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          SRD Data Importer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Import D&D 5E SRD data from Open5e API. Imports run in the background
          — check edge function logs for progress. Junk entries (empty
          spells/feats) are auto-cleaned after import.
        </p>

        <Button
          onClick={importAll}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {loading === "All SRD Data" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isCompleted("All SRD Data")
            ? "✓ Full Re-Import Started"
            : "Full Re-Import All SRD Data"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          {IMPORT_CATEGORIES.map(({ key, label }) => (
            <Button
              key={key}
              onClick={() => importCategory(key, label)}
              disabled={isLoading}
              variant={isCompleted(label) ? "secondary" : "outline"}
              size="sm"
            >
              {loading === label && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isCompleted(label) && (
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              )}
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
