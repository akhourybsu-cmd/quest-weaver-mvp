import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpellSaveDCExtractor } from "./SpellSaveDCExtractor";

const MonsterImportDialog = () => {
  const [open, setOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [fetchingOpen5e, setFetchingOpen5e] = useState(false);
  const { toast } = useToast();

  const handleFetchOpen5e = async () => {
    setFetchingOpen5e(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-open5e-monsters');

      if (error) throw error;

      toast({
        title: "Success!",
        description: data.message || `Imported ${data.imported} monsters from Open5e SRD`,
      });

      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Failed to fetch monsters from Open5e",
        variant: "destructive",
      });
    } finally {
      setFetchingOpen5e(false);
    }
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste JSON data to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const monsters = JSON.parse(jsonInput);

      if (!Array.isArray(monsters)) {
        throw new Error("JSON must be an array of monsters");
      }

      const { data, error } = await supabase.functions.invoke('import-srd-monsters', {
        body: { monsters },
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: data.message || `Imported ${data.imported} monsters`,
      });

      setJsonInput("");
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Failed to parse or import monsters",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const exampleFormat = `[
  {
    "name": "Skeleton",
    "type": "undead",
    "size": "medium",
    "alignment": "lawful evil",
    "cr": 0.25,
    "ac": 13,
    "hp_avg": 13,
    "hp_formula": "2d8+4",
    "speed": {"walk": 30},
    "abilities": {
      "str": 10,
      "dex": 14,
      "con": 15,
      "int": 6,
      "wis": 8,
      "cha": 5
    },
    "immunities": ["poison"],
    "traits": [],
    "actions": [
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage."
      }
    ]
  }
]`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Import Monsters
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Monster Data</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="open5e" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open5e">Open5e SRD</TabsTrigger>
            <TabsTrigger value="custom">Custom JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="open5e" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Fetch the complete SRD 5e monster library directly from Open5e API. This will import 300+ official monsters.
              </p>
              <Button 
                onClick={handleFetchOpen5e} 
                disabled={fetchingOpen5e}
                className="w-full"
              >
                {fetchingOpen5e ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching from Open5e...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Fetch Open5e SRD Monsters
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Paste a JSON array of monsters in the SRD format.
              </p>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
                  Show example format
                </summary>
                <pre className="bg-muted p-3 rounded overflow-x-auto">
                  {exampleFormat}
                </pre>
              </details>
            </div>

            <Textarea
              placeholder="Paste monster JSON here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setJsonInput("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <SpellSaveDCExtractor />
      </DialogContent>
    </Dialog>
  );
};

export default MonsterImportDialog;
