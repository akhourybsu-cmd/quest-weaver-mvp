import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Save, Loader2, User, BookOpen, Feather } from "lucide-react";

interface CharacterNarrativeSheetProps {
  characterId: string;
}

interface NarrativeData {
  personality_traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  notes: string;
  alignment: string;
  age: string;
  height: string;
  weight: string;
  eyes: string;
  skin: string;
  hair: string;
}

const EMPTY: NarrativeData = {
  personality_traits: "",
  ideals: "",
  bonds: "",
  flaws: "",
  notes: "",
  alignment: "",
  age: "",
  height: "",
  weight: "",
  eyes: "",
  skin: "",
  hair: "",
};

export function CharacterNarrativeSheet({ characterId }: CharacterNarrativeSheetProps) {
  const [data, setData] = useState<NarrativeData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: row, error } = await supabase
        .from("characters")
        .select("personality_traits, ideals, bonds, flaws, notes, alignment, age, height, weight, eyes, skin, hair")
        .eq("id", characterId)
        .single();

      if (!mounted) return;
      if (error) {
        toast({ title: "Error", description: "Failed to load narrative data.", variant: "destructive" });
        setLoading(false);
        return;
      }
      setData({
        personality_traits: row.personality_traits || "",
        ideals: row.ideals || "",
        bonds: row.bonds || "",
        flaws: row.flaws || "",
        notes: row.notes || "",
        alignment: row.alignment || "",
        age: row.age || "",
        height: row.height || "",
        weight: row.weight || "",
        eyes: row.eyes || "",
        skin: row.skin || "",
        hair: row.hair || "",
      });
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [characterId]);

  const update = (field: keyof NarrativeData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("characters")
      .update({
        personality_traits: data.personality_traits.trim() || null,
        ideals: data.ideals.trim() || null,
        bonds: data.bonds.trim() || null,
        flaws: data.flaws.trim() || null,
        notes: data.notes.trim() || null,
        alignment: data.alignment.trim() || null,
        age: data.age.trim() || null,
        height: data.height.trim() || null,
        weight: data.weight.trim() || null,
        eyes: data.eyes.trim() || null,
        skin: data.skin.trim() || null,
        hair: data.hair.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
      return;
    }
    toast({ title: "Narrative saved", description: "Your character's story has been updated." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  const physicalFields: { key: keyof NarrativeData; label: string; placeholder: string }[] = [
    { key: "alignment", label: "Alignment", placeholder: "e.g., Chaotic Good" },
    { key: "age", label: "Age", placeholder: "e.g., 27 years" },
    { key: "height", label: "Height", placeholder: "e.g., 5'10\"" },
    { key: "weight", label: "Weight", placeholder: "e.g., 160 lbs" },
    { key: "eyes", label: "Eyes", placeholder: "e.g., Blue" },
    { key: "skin", label: "Skin", placeholder: "e.g., Fair" },
    { key: "hair", label: "Hair", placeholder: "e.g., Long black hair" },
  ];

  const narrativeFields: { key: keyof NarrativeData; label: string; placeholder: string; rows: number }[] = [
    { key: "personality_traits", label: "Personality Traits", placeholder: "What defines your character's personality?", rows: 3 },
    { key: "ideals", label: "Ideals", placeholder: "What principles guide your character?", rows: 3 },
    { key: "bonds", label: "Bonds", placeholder: "What connections tie your character to the world?", rows: 3 },
    { key: "flaws", label: "Flaws", placeholder: "What weaknesses or vices does your character have?", rows: 3 },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Save bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-cinzel font-bold text-foreground flex items-center gap-2">
          <Feather className="w-5 h-5 text-brass" />
          Character Narrative
        </h2>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Physical Description */}
        <Card className="border-brass/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-cinzel flex items-center gap-2">
              <User className="w-4 h-4 text-brass" />
              Physical Description
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {physicalFields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={f.key} className="text-xs text-muted-foreground">
                  {f.label}
                </Label>
                <Input
                  id={f.key}
                  value={data[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="h-9 text-sm"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Personality */}
        <Card className="border-brass/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-cinzel flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brass" />
              Personality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {narrativeFields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={f.key} className="text-xs text-muted-foreground">
                  {f.label}
                </Label>
                <Textarea
                  id={f.key}
                  value={data[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={f.rows}
                  className="resize-none text-sm"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Backstory — full width */}
      <Card className="border-brass/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-cinzel flex items-center gap-2">
            <Feather className="w-4 h-4 text-brass" />
            Backstory &amp; Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Write your character's backstory, motivations, relationships, fears, dreams, and what drives them forward..."
            rows={12}
            className="resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Include your background, motivations, relationships, and anything that brings your character to life.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
