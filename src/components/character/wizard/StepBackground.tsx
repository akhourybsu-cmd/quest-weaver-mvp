import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAtom, useSetAtom } from "jotai";
import { draftAtom, setBackgroundAtom, applyGrantsAtom, setNeedsAtom } from "@/state/characterWizard";
import { SRD, type SrdBackground } from "@/lib/srd/SRDClient";
import { grantsFromBackground, needsFromBackground } from "@/lib/rules/5eRules";

const StepBackground = () => {
  const [draft] = useAtom(draftAtom);
  const setBackground = useSetAtom(setBackgroundAtom);
  const applyGrants = useSetAtom(applyGrantsAtom);
  const setNeeds = useSetAtom(setNeedsAtom);

  const [backgrounds, setBackgrounds] = useState<SrdBackground[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<SrdBackground | null>(null);

  useEffect(() => {
    SRD.backgrounds().then(setBackgrounds);
  }, []);

  useEffect(() => {
    if (draft.backgroundId && backgrounds.length > 0) {
      const bg = backgrounds.find(b => b.id === draft.backgroundId);
      if (bg) {
        setSelectedBackground(bg);
      }
    }
  }, [draft.backgroundId, backgrounds]);

  const handleBackgroundChange = (backgroundId: string) => {
    const bg = backgrounds.find(b => b.id === backgroundId);
    if (!bg) return;

    setBackground(backgroundId);
    setSelectedBackground(bg);

    // Auto-grant from background
    const grants = grantsFromBackground(bg);
    applyGrants(grants);

    // Set needs for choices
    const needs = needsFromBackground(bg);
    setNeeds(needs);
  };

  const skills = Array.from(draft.grants.skillProficiencies);
  const tools = Array.from(draft.grants.toolProficiencies);
  const languages = Array.from(draft.grants.languages);
  const features = draft.grants.features.filter(f => f.source === "background");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-cinzel font-semibold mb-2 text-brass tracking-wide flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Background
        </h3>
        <div className="h-px bg-gradient-to-r from-brass/50 via-brass/20 to-transparent mb-4" />
        <p className="text-sm text-muted-foreground mb-6">
          Your background reveals where you came from and how you became an adventurer.
        </p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="background">Background *</Label>
          <Select 
            value={draft.backgroundId} 
            onValueChange={handleBackgroundChange}
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
        <Card className="fantasy-border-ornaments animate-fade-in">
          <CardHeader>
            <CardTitle className="font-cinzel text-brass">{selectedBackground.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {skills.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Skill Proficiencies:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {skills.map(skill => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {tools.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Tool Proficiencies:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tools.map(tool => (
                    <Badge key={tool} variant="secondary">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Languages:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {languages.map(lang => (
                    <Badge key={lang} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {features.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Feature:</span>
                <div className="space-y-2 mt-2">
                  {features.map((feature, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium">{feature.name}</div>
                      {feature.description && (
                        <div className="text-muted-foreground mt-1">{feature.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {draft.needs.skill && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  You will choose {draft.needs.skill.required} additional skill{draft.needs.skill.required > 1 ? 's' : ''} in the next step.
                </span>
              </div>
            )}

            {draft.needs.tool && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  You will choose {draft.needs.tool.required} tool proficienc{draft.needs.tool.required > 1 ? 'ies' : 'y'} in the next step.
                </span>
              </div>
            )}

            {draft.needs.language && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  You will choose {draft.needs.language.required} additional language{draft.needs.language.required > 1 ? 's' : ''} in the next step.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepBackground;
