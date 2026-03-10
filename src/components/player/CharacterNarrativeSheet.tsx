import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Save, Loader2, User, BookOpen, Feather, Pen, X } from "lucide-react";

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
  const [editing, setEditing] = useState(false);
  const savedData = useRef<NarrativeData>(EMPTY);
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
      const loaded: NarrativeData = {
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
      };
      setData(loaded);
      savedData.current = loaded;
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [characterId]);

  const update = (field: keyof NarrativeData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const handleEdit = () => {
    savedData.current = { ...data };
    setEditing(true);
  };

  const handleCancel = () => {
    setData(savedData.current);
    setEditing(false);
  };

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
    savedData.current = { ...data };
    setEditing(false);
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

  // ── READ MODE ──
  if (!editing) {
    return (
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-cinzel font-bold text-foreground flex items-center gap-2">
            <Feather className="w-5 h-5 text-brass" />
            Character Narrative
          </h2>
          <Button variant="outline" onClick={handleEdit} className="gap-2 border-brass/40 hover:border-brass">
            <Pen className="w-4 h-4" />
            Edit Narrative
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Physical Description – read */}
          <Card className="border-brass/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-cinzel flex items-center gap-2">
                <User className="w-4 h-4 text-brass" />
                Physical Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {physicalFields.map((f) => (
                  <div key={f.key}>
                    <dt className="text-muted-foreground text-xs font-medium">{f.label}</dt>
                    <dd className="font-medium text-foreground" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      {data[f.key] || <span className="italic text-muted-foreground/60">Not set</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Personality – read */}
          <Card className="border-brass/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-cinzel flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brass" />
                Personality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {narrativeFields.map((f) => (
                <div key={f.key}>
                  <h4 className="text-xs font-semibold text-brass uppercase tracking-wider mb-1">{f.label}</h4>
                  {data[f.key] ? (
                    <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      {data[f.key]}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/60">Not yet written…</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Backstory – read */}
        <Card className="border-brass/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-cinzel flex items-center gap-2">
              <Feather className="w-4 h-4 text-brass" />
              Backstory &amp; Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.notes ? (
              <div className="fantasy-chronicle fantasy-drop-cap p-4 rounded-md">
                {data.notes.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-sm text-foreground leading-relaxed mb-3 last:mb-0" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground/60 py-8 text-center">
                No backstory written yet. Click "Edit Narrative" to begin your character's tale…
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── EDIT MODE ──
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-cinzel font-bold text-foreground flex items-center gap-2">
          <Feather className="w-5 h-5 text-brass" />
          Editing Narrative
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleCancel} className="gap-2">
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Physical Description – edit */}
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
                <Label htmlFor={f.key} className="text-xs text-muted-foreground">{f.label}</Label>
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

        {/* Personality – edit */}
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
                <Label htmlFor={f.key} className="text-xs text-muted-foreground">{f.label}</Label>
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

      {/* Backstory – edit */}
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
