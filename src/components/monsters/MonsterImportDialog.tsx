import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, Download } from "lucide-react";

const MonsterImportDialog = () => {
  const [open, setOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste JSON monster data",
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
        body: { monsters }
      });

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: data.message || `Imported ${monsters.length} monsters`,
      });

      setOpen(false);
      setJsonInput("");
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Invalid JSON format",
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
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import SRD Monsters</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Paste JSON array of monsters in the SRD format below. The database already includes some starter monsters.
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
                  <Download className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> You can find SRD monster data from sources like the{" "}
              <a 
                href="https://www.dndbeyond.com/monsters" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                D&D Beyond Monster List
              </a>
              {" "}or the{" "}
              <a 
                href="https://5e.tools/bestiary.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                5etools Bestiary
              </a>
              . Export as JSON and paste here.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonsterImportDialog;
