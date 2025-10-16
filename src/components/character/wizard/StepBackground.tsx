import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "../CharacterWizard";

interface StepBackgroundProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const StepBackground = ({ data, updateData }: StepBackgroundProps) => {
  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<any>(null);

  useEffect(() => {
    loadBackgrounds();
  }, []);

  useEffect(() => {
    if (data.backgroundId) {
      const background = backgrounds.find(b => b.id === data.backgroundId);
      setSelectedBackground(background);
    }
  }, [data.backgroundId, backgrounds]);

  const loadBackgrounds = async () => {
    const { data: backgroundData, error } = await supabase
      .from("srd_backgrounds")
      .select("*")
      .order("name");
      
    if (!error && backgroundData) {
      setBackgrounds(backgroundData);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Background</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your background reveals where you came from and how you became an adventurer. It provides skill proficiencies, tool proficiencies, languages, and equipment.
        </p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="background">Background *</Label>
          <Select 
            value={data.backgroundId} 
            onValueChange={(value) => updateData({ backgroundId: value })}
          >
            <SelectTrigger id="background">
              <SelectValue placeholder="Select background" />
            </SelectTrigger>
            <SelectContent>
              {backgrounds.map((bg) => (
                <SelectItem key={bg.id} value={bg.id}>
                  {bg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedBackground && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedBackground.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.isArray(selectedBackground.skill_proficiencies) && selectedBackground.skill_proficiencies.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Skill Proficiencies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBackground.skill_proficiencies.map((skill: any, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {typeof skill === 'string' ? skill : skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selectedBackground.tool_proficiencies) && selectedBackground.tool_proficiencies.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tool Proficiencies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBackground.tool_proficiencies.map((tool: any, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {typeof tool === 'string' ? tool : tool.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selectedBackground.languages) && selectedBackground.languages.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBackground.languages.map((lang: any, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {typeof lang === 'string' ? lang : lang.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedBackground.feature && (
              <div>
                <h4 className="font-medium mb-2">Feature</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedBackground.feature}
                </p>
              </div>
            )}

            {Array.isArray(selectedBackground.equipment) && selectedBackground.equipment.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Starting Equipment</h4>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {selectedBackground.equipment.map((item: any, idx: number) => (
                    <li key={idx}>
                      {typeof item === 'string' ? item : item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepBackground;
