import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";
import { PortraitCropper } from "@/components/character/PortraitCropper";
import { User } from "lucide-react";

const ALIGNMENTS = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
];

const StepDescription = () => {
  const [draft, setDraft] = useAtom(draftAtom);

  const updateField = (field: string, value: string) => {
    setDraft({ ...draft, [field]: value });
  };

  const handlePortraitCropped = (blob: Blob, url: string) => {
    setDraft({ ...draft, portraitBlob: blob, portraitUrl: url });
  };

  const getInitials = () => {
    return draft.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Character Description</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Add personality and physical details to bring your character to life. All fields are optional.
        </p>
      </div>

      {/* Portrait Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Label className="text-base font-semibold">Character Portrait</Label>
            <Avatar className="w-32 h-32 border-4 border-border shadow-xl">
              {draft.portraitUrl ? (
                <AvatarImage src={draft.portraitUrl} alt={draft.name} />
              ) : (
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                  {draft.name ? getInitials() : <User className="w-12 h-12" />}
                </AvatarFallback>
              )}
            </Avatar>
            <PortraitCropper onImageCropped={handlePortraitCropped} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alignment">Alignment</Label>
              <Select 
                value={draft.alignment || ""} 
                onValueChange={(value) => updateField("alignment", value)}
              >
                <SelectTrigger id="alignment">
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  {ALIGNMENTS.map((align) => (
                    <SelectItem key={align} value={align}>
                      {align}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={draft.age || ""}
                onChange={(e) => updateField("age", e.target.value)}
                placeholder="e.g., 25 years"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={draft.height || ""}
                onChange={(e) => updateField("height", e.target.value)}
                placeholder="e.g., 6 feet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={draft.weight || ""}
                onChange={(e) => updateField("weight", e.target.value)}
                placeholder="e.g., 180 lbs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eyes">Eyes</Label>
              <Input
                id="eyes"
                value={draft.eyes || ""}
                onChange={(e) => updateField("eyes", e.target.value)}
                placeholder="Color"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skin">Skin</Label>
              <Input
                id="skin"
                value={draft.skin || ""}
                onChange={(e) => updateField("skin", e.target.value)}
                placeholder="Tone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hair">Hair</Label>
              <Input
                id="hair"
                value={draft.hair || ""}
                onChange={(e) => updateField("hair", e.target.value)}
                placeholder="Color/Style"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personality">Personality Traits</Label>
            <Textarea
              id="personality"
              value={draft.personality || ""}
              onChange={(e) => updateField("personality", e.target.value)}
              placeholder="How does your character behave?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ideals">Ideals</Label>
            <Textarea
              id="ideals"
              value={draft.ideals || ""}
              onChange={(e) => updateField("ideals", e.target.value)}
              placeholder="What does your character believe in?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bonds">Bonds</Label>
            <Textarea
              id="bonds"
              value={draft.bonds || ""}
              onChange={(e) => updateField("bonds", e.target.value)}
              placeholder="What ties bind your character?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flaws">Flaws</Label>
            <Textarea
              id="flaws"
              value={draft.flaws || ""}
              onChange={(e) => updateField("flaws", e.target.value)}
              placeholder="What are your character's weaknesses?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={draft.notes || ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Backstory, connections, or other details"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepDescription;
