import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { SKILLS } from "@/lib/characterRules";
import type { WizardData } from "../CharacterWizard";

interface StepProficienciesProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const StepProficiencies = ({ data, updateData }: StepProficienciesProps) => {
  const toggleSkill = (skillName: string) => {
    const currentSkills = data.skills || [];
    const newSkills = currentSkills.includes(skillName)
      ? currentSkills.filter(s => s !== skillName)
      : [...currentSkills, skillName];
    updateData({ skills: newSkills });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Proficiencies</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select your skill proficiencies based on your class and background. Some proficiencies may already be granted by your choices.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-4">Skill Proficiencies</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Choose the skills you're proficient in (typically 2-4 from your class + 2 from background).
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {SKILLS.map((skill) => {
              const isSelected = data.skills?.includes(skill.name);
              return (
                <div key={skill.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={skill.name}
                    checked={isSelected}
                    onCheckedChange={() => toggleSkill(skill.name)}
                  />
                  <Label
                    htmlFor={skill.name}
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    {skill.name}
                    <Badge variant="outline" className="text-xs">
                      {skill.ability.toUpperCase()}
                    </Badge>
                  </Label>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Selected: {data.skills?.length || 0} skills
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-4">Languages</h4>
          <p className="text-sm text-muted-foreground">
            Languages are granted by your ancestry and background. Additional languages can be added here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.languages?.map((lang, idx) => (
              <Badge key={idx} variant="secondary">{lang}</Badge>
            ))}
            {(!data.languages || data.languages.length === 0) && (
              <span className="text-sm text-muted-foreground">Languages will be added from your ancestry and background</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-4">Tool Proficiencies</h4>
          <p className="text-sm text-muted-foreground">
            Tool proficiencies are granted by your class, background, or ancestry.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.tools?.map((tool, idx) => (
              <Badge key={idx} variant="outline">{tool}</Badge>
            ))}
            {(!data.tools || data.tools.length === 0) && (
              <span className="text-sm text-muted-foreground">Tool proficiencies will be added from your background</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepProficiencies;
