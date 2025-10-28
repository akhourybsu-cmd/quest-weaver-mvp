import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollText, Save } from "lucide-react";

interface Character {
  id: string;
  name: string;
  notes?: string;
  alignment?: string;
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
}

interface PlayerBackstoryProps {
  characterId: string;
}

export function PlayerBackstory({ characterId }: PlayerBackstoryProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [backstory, setBackstory] = useState("");
  const [alignment, setAlignment] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [eyes, setEyes] = useState("");
  const [skin, setSkin] = useState("");
  const [hair, setHair] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCharacter();
  }, [characterId]);

  const fetchCharacter = async () => {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (error) {
      toast({
        title: "Error loading character",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setCharacter(data);
      setBackstory(data.notes || "");
      setAlignment(data.alignment || "");
      setAge(data.age || "");
      setHeight(data.height || "");
      setWeight(data.weight || "");
      setEyes(data.eyes || "");
      setSkin(data.skin || "");
      setHair(data.hair || "");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await supabase
      .from('characters')
      .update({
        notes: backstory.trim(),
        alignment: alignment.trim(),
        age: age.trim(),
        height: height.trim(),
        weight: weight.trim(),
        eyes: eyes.trim(),
        skin: skin.trim(),
        hair: hair.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', characterId);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Error saving backstory",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Backstory saved",
      description: "Your character details have been updated",
    });

    fetchCharacter();
  };

  if (!character) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Loading character...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="w-6 h-6" />
          {character.name}'s Story
        </h2>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Physical Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alignment">Alignment</Label>
              <Input
                id="alignment"
                value={alignment}
                onChange={(e) => setAlignment(e.target.value)}
                placeholder="e.g., Chaotic Good"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 27 years"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 5'10&quot;"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 160 lbs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eyes">Eyes</Label>
              <Input
                id="eyes"
                value={eyes}
                onChange={(e) => setEyes(e.target.value)}
                placeholder="e.g., Blue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skin">Skin</Label>
              <Input
                id="skin"
                value={skin}
                onChange={(e) => setSkin(e.target.value)}
                placeholder="e.g., Fair"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hair">Hair</Label>
              <Input
                id="hair"
                value={hair}
                onChange={(e) => setHair(e.target.value)}
                placeholder="e.g., Long black hair"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backstory & Personality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="backstory">Your Character's Story</Label>
            <Textarea
              id="backstory"
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              placeholder="Write your character's backstory, personality traits, bonds, ideals, flaws, and any other details that bring them to life..."
              rows={20}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Include your background, motivations, relationships, fears, dreams, and what drives your character forward.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
