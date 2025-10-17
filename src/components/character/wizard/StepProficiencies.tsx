import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAtom, useSetAtom } from "jotai";
import { draftAtom, toggleSkillAtom, toggleToolAtom, toggleLanguageAtom } from "@/state/characterWizard";
import { computeLegalSkillPool, remaining } from "@/lib/rules/5eRules";
import type { WizardData } from "../CharacterWizard";

interface StepProficienciesProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const StepProficiencies = ({ data, updateData }: StepProficienciesProps) => {
  const [draft] = useAtom(draftAtom);
  const toggleSkill = useSetAtom(toggleSkillAtom);
  const toggleTool = useSetAtom(toggleToolAtom);
  const toggleLanguage = useSetAtom(toggleLanguageAtom);

  // Compute legal options and remaining counts
  const classSkillNeeds = draft.needs.skill;
  const legalSkills = classSkillNeeds 
    ? computeLegalSkillPool(classSkillNeeds.from, draft.grants.skillProficiencies)
    : [];
  const remainingSkills = classSkillNeeds 
    ? remaining(classSkillNeeds.required, draft.choices.skills)
    : 0;

  const toolNeeds = draft.needs.tool;
  const legalTools = toolNeeds?.from || [];
  const remainingTools = toolNeeds 
    ? remaining(toolNeeds.required, draft.choices.tools)
    : 0;

  const languageNeeds = draft.needs.language;
  const legalLanguages = languageNeeds?.from || [];
  const remainingLanguages = languageNeeds 
    ? remaining(languageNeeds.required, draft.choices.languages)
    : 0;

  const grantedSkills = Array.from(draft.grants.skillProficiencies);
  const grantedTools = Array.from(draft.grants.toolProficiencies);
  const grantedLanguages = Array.from(draft.grants.languages);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Proficiencies</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose your additional proficiencies. Some are already granted by your class, ancestry, and background.
        </p>
      </div>

      {/* Granted Skills */}
      {grantedSkills.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">
              Granted Skill Proficiencies
              <Badge variant="secondary" className="ml-2">{grantedSkills.length}</Badge>
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              These skills are automatically granted by your selections
            </p>
            <div className="flex flex-wrap gap-2">
              {grantedSkills.map(skill => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Choose Skills */}
      {classSkillNeeds && legalSkills.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Choose Skill Proficiencies</h4>
              <Badge variant={remainingSkills === 0 ? "default" : "destructive"}>
                {remainingSkills} remaining
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Select {classSkillNeeds.required} skill{classSkillNeeds.required > 1 ? 's' : ''} from the available options
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {legalSkills.map((skill) => {
                const isSelected = draft.choices.skills.includes(skill);
                const canToggle = isSelected || remainingSkills > 0;
                
                return (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={`skill-${skill}`}
                      checked={isSelected}
                      onCheckedChange={() => canToggle && toggleSkill(skill)}
                      disabled={!canToggle}
                    />
                    <Label
                      htmlFor={`skill-${skill}`}
                      className={`text-sm cursor-pointer ${!canToggle ? 'opacity-50' : ''}`}
                    >
                      {skill}
                    </Label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Granted Tools */}
      {grantedTools.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">
              Granted Tool Proficiencies
              <Badge variant="secondary" className="ml-2">{grantedTools.length}</Badge>
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              These tools are automatically granted by your selections
            </p>
            <div className="flex flex-wrap gap-2">
              {grantedTools.map(tool => (
                <Badge key={tool} variant="outline">
                  {tool}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Choose Tools */}
      {toolNeeds && legalTools.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Choose Tool Proficiencies</h4>
              <Badge variant={remainingTools === 0 ? "default" : "destructive"}>
                {remainingTools} remaining
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Select {toolNeeds.required} tool proficienc{toolNeeds.required > 1 ? 'ies' : 'y'} from the available options
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {legalTools.map((tool) => {
                const isSelected = draft.choices.tools.includes(tool);
                const canToggle = isSelected || remainingTools > 0;
                
                return (
                  <div key={tool} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tool-${tool}`}
                      checked={isSelected}
                      onCheckedChange={() => canToggle && toggleTool(tool)}
                      disabled={!canToggle}
                    />
                    <Label
                      htmlFor={`tool-${tool}`}
                      className={`text-sm cursor-pointer ${!canToggle ? 'opacity-50' : ''}`}
                    >
                      {tool}
                    </Label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Granted Languages */}
      {grantedLanguages.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">
              Granted Languages
              <Badge variant="secondary" className="ml-2">{grantedLanguages.length}</Badge>
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              These languages are automatically granted by your selections
            </p>
            <div className="flex flex-wrap gap-2">
              {grantedLanguages.map(lang => (
                <Badge key={lang} variant="outline">
                  {lang}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Choose Languages */}
      {languageNeeds && legalLanguages.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Choose Additional Languages</h4>
              <Badge variant={remainingLanguages === 0 ? "default" : "destructive"}>
                {remainingLanguages} remaining
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Select {languageNeeds.required} additional language{languageNeeds.required > 1 ? 's' : ''} from the available options
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {legalLanguages.map((language) => {
                const isSelected = draft.choices.languages.includes(language);
                const canToggle = isSelected || remainingLanguages > 0;
                
                return (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${language}`}
                      checked={isSelected}
                      onCheckedChange={() => canToggle && toggleLanguage(language)}
                      disabled={!canToggle}
                    />
                    <Label
                      htmlFor={`lang-${language}`}
                      className={`text-sm cursor-pointer ${!canToggle ? 'opacity-50' : ''}`}
                    >
                      {language}
                    </Label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!classSkillNeeds && !toolNeeds && !languageNeeds && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No additional proficiency choices are required. Your class, ancestry, and background have granted all necessary proficiencies.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepProficiencies;
