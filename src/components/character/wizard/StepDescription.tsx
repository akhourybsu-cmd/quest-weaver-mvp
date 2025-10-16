import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WizardData } from "../CharacterWizard";

interface StepDescriptionProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

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

const StepDescription = ({ data, updateData }: StepDescriptionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Character Description</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Add personality and physical details to bring your character to life. All fields are optional.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alignment">Alignment</Label>
              <Select 
                value={data.alignment || ""} 
                onValueChange={(value) => updateData({ alignment: value })}
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
                value={data.age || ""}
                onChange={(e) => updateData({ age: e.target.value })}
                placeholder="e.g., 25 years"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={data.height || ""}
                onChange={(e) => updateData({ height: e.target.value })}
                placeholder="e.g., 6 feet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={data.weight || ""}
                onChange={(e) => updateData({ weight: e.target.value })}
                placeholder="e.g., 180 lbs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eyes">Eyes</Label>
              <Input
                id="eyes"
                value={data.eyes || ""}
                onChange={(e) => updateData({ eyes: e.target.value })}
                placeholder="Color"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skin">Skin</Label>
              <Input
                id="skin"
                value={data.skin || ""}
                onChange={(e) => updateData({ skin: e.target.value })}
                placeholder="Tone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hair">Hair</Label>
              <Input
                id="hair"
                value={data.hair || ""}
                onChange={(e) => updateData({ hair: e.target.value })}
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
              value={data.personality || ""}
              onChange={(e) => updateData({ personality: e.target.value })}
              placeholder="How does your character behave?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ideals">Ideals</Label>
            <Textarea
              id="ideals"
              value={data.ideals || ""}
              onChange={(e) => updateData({ ideals: e.target.value })}
              placeholder="What does your character believe in?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bonds">Bonds</Label>
            <Textarea
              id="bonds"
              value={data.bonds || ""}
              onChange={(e) => updateData({ bonds: e.target.value })}
              placeholder="What ties bind your character?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flaws">Flaws</Label>
            <Textarea
              id="flaws"
              value={data.flaws || ""}
              onChange={(e) => updateData({ flaws: e.target.value })}
              placeholder="What are your character's weaknesses?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={data.notes || ""}
              onChange={(e) => updateData({ notes: e.target.value })}
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
