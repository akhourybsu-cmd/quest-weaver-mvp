import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface CharacterExporterProps {
  characterId: string;
  onImportComplete?: () => void;
}

export const CharacterExporter = ({ characterId, onImportComplete }: CharacterExporterProps) => {
  const [exportData, setExportData] = useState<string>("");
  const [importData, setImportData] = useState<string>("");
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleExport = async () => {
    try {
      const { data: character, error } = await supabase
        .from("characters")
        .select(`
          *,
          character_abilities(*),
          character_attacks(*),
          character_equipment(*),
          character_features(*),
          character_feats(*),
          character_languages(*),
          character_proficiencies(*),
          character_saves(*),
          character_skills(*),
          character_spells(*),
          character_classes(*)
        `)
        .eq("id", characterId)
        .single();

      if (error) throw error;

      // Clean up the data for export
      const exportPayload = {
        version: "1.0",
        exported_at: new Date().toISOString(),
        character: {
          ...character,
          id: undefined, // Remove ID for clean import
          user_id: undefined,
          campaign_id: undefined,
          created_at: undefined,
          updated_at: undefined,
        }
      };

      const jsonString = JSON.stringify(exportPayload, null, 2);
      setExportData(jsonString);

      // Update export timestamp
      await supabase
        .from("characters")
        .update({ last_exported_at: new Date().toISOString() })
        .eq("id", characterId);

      setShowExport(true);
    } catch (error) {
      console.error("Error exporting character:", error);
      toast.error("Failed to export character");
    }
  };

  const handleImport = async () => {
    try {
      const importPayload = JSON.parse(importData);
      
      if (!importPayload.character) {
        throw new Error("Invalid import format");
      }

      const characterData = importPayload.character;
      const {
        character_abilities,
        character_attacks,
        character_equipment,
        character_features,
        character_feats,
        character_languages,
        character_proficiencies,
        character_saves,
        character_skills,
        character_spells,
        character_classes,
        ...mainCharacter
      } = characterData;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert main character
      const { data: newChar, error: charError } = await supabase
        .from("characters")
        .insert({
          ...mainCharacter,
          user_id: user.id,
          creation_status: 'complete'
        })
        .select()
        .single();

      if (charError) throw charError;

      // Insert related data
      if (character_abilities?.[0]) {
        const { id, character_id, ...abilities } = character_abilities[0];
        await supabase
          .from("character_abilities")
          .insert({ ...abilities, character_id: newChar.id });
      }

      if (character_saves?.[0]) {
        const { id, character_id, ...saves } = character_saves[0];
        await supabase
          .from("character_saves")
          .insert({ ...saves, character_id: newChar.id });
      }

      if (character_skills) {
        const skills = character_skills.map(({ id, character_id, ...skill }: any) => ({
          ...skill,
          character_id: newChar.id
        }));
        await supabase.from("character_skills").insert(skills);
      }

      if (character_proficiencies) {
        const profs = character_proficiencies.map(({ id, character_id, ...prof }: any) => ({
          ...prof,
          character_id: newChar.id
        }));
        await supabase.from("character_proficiencies").insert(profs);
      }

      if (character_languages) {
        const langs = character_languages.map(({ id, character_id, ...lang }: any) => ({
          ...lang,
          character_id: newChar.id
        }));
        await supabase.from("character_languages").insert(langs);
      }

      if (character_features) {
        const features = character_features.map(({ id, character_id, ...feature }: any) => ({
          ...feature,
          character_id: newChar.id
        }));
        await supabase.from("character_features").insert(features);
      }

      toast.success("Character imported successfully!");
      setShowImport(false);
      setImportData("");
      onImportComplete?.();
    } catch (error) {
      console.error("Error importing character:", error);
      toast.error("Failed to import character. Please check the format.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportData);
    toast.success("Copied to clipboard!");
  };

  const downloadJSON = () => {
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `character-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started!");
  };

  return (
    <div className="flex gap-2">
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Character</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={exportData}
              readOnly
              className="font-mono text-xs h-96"
            />
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                Copy to Clipboard
              </Button>
              <Button onClick={downloadJSON} className="flex-1">
                Download JSON
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Character</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste character JSON here..."
              className="font-mono text-xs h-96"
            />
            <Button onClick={handleImport} className="w-full">
              Import Character
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
