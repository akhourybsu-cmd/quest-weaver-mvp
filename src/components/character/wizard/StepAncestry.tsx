import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAtom, useSetAtom } from "jotai";
import { draftAtom, setAncestryAtom, setSubAncestryAtom, applyGrantsAtom } from "@/state/characterWizard";
import { SRD, type SrdAncestry, type SrdSubAncestry } from "@/lib/srd/SRDClient";
import { grantsFromAncestry, grantsFromSubAncestry } from "@/lib/rules/5eRules";
import type { WizardData } from "../CharacterWizard";

interface StepAncestryProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const StepAncestry = ({ data, updateData }: StepAncestryProps) => {
  const [draft] = useAtom(draftAtom);
  const setAncestry = useSetAtom(setAncestryAtom);
  const setSubAncestry = useSetAtom(setSubAncestryAtom);
  const applyGrants = useSetAtom(applyGrantsAtom);

  const [ancestries, setAncestries] = useState<SrdAncestry[]>([]);
  const [subAncestries, setSubAncestries] = useState<SrdSubAncestry[]>([]);
  const [selectedAncestry, setSelectedAncestry] = useState<SrdAncestry | null>(null);

  useEffect(() => {
    SRD.ancestries().then(setAncestries);
  }, []);

  useEffect(() => {
    if (draft.ancestryId && ancestries.length > 0) {
      const ancestry = ancestries.find(a => a.id === draft.ancestryId);
      if (ancestry) {
        setSelectedAncestry(ancestry);
        SRD.subAncestries(ancestry.id).then(setSubAncestries);
      }
    }
  }, [draft.ancestryId, ancestries]);

  const handleAncestryChange = async (ancestryId: string) => {
    const ancestry = ancestries.find(a => a.id === ancestryId);
    if (!ancestry) return;

    setAncestry(ancestryId);
    setSelectedAncestry(ancestry);
    updateData({ ancestryId, subancestryId: undefined });

    const grants = grantsFromAncestry(ancestry);
    applyGrants(grants);

    const subs = await SRD.subAncestries(ancestryId);
    setSubAncestries(subs);
  };

  const handleSubAncestryChange = (subAncestryId: string) => {
    const subAncestry = subAncestries.find(sa => sa.id === subAncestryId);
    if (!subAncestry) return;

    setSubAncestry(subAncestryId);
    updateData({ subAncestryId });

    const grants = grantsFromSubAncestry(subAncestry);
    applyGrants(grants);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Ancestry & Heritage</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose your character's ancestry (race). This determines base traits, ability score bonuses, and special features.
        </p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="ancestry">Ancestry *</Label>
          <Select value={draft.ancestryId} onValueChange={handleAncestryChange}>
            <SelectTrigger id="ancestry">
              <SelectValue placeholder="Select ancestry" />
            </SelectTrigger>
            <SelectContent>
              {ancestries.map((ancestry) => (
                <SelectItem key={ancestry.id} value={ancestry.id}>
                  {ancestry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {subAncestries.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subancestry">Heritage</Label>
            <Select 
              value={draft.subAncestryId || ""} 
              onValueChange={handleSubAncestryChange}
            >
              <SelectTrigger id="subancestry">
                <SelectValue placeholder="Select subancestry (optional)" />
              </SelectTrigger>
              <SelectContent>
                {subAncestries.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedAncestry && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedAncestry.name}</CardTitle>
            <CardDescription>
              Size: {selectedAncestry.size} • Speed: {selectedAncestry.speed} ft.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.isArray(selectedAncestry.ability_bonuses) && selectedAncestry.ability_bonuses.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Ability Score Bonuses</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAncestry.ability_bonuses.map((bonus: any, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {bonus.ability?.toUpperCase()} +{bonus.bonus}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selectedAncestry.languages) && selectedAncestry.languages.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAncestry.languages.map((lang: any, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {typeof lang === 'string' ? lang : lang.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selectedAncestry.traits) && selectedAncestry.traits.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Traits</h4>
                <ul className="space-y-2 text-sm">
                  {selectedAncestry.traits.map((trait: any, idx: number) => (
                    <li key={idx}>
                      <span className="font-medium">{trait.name}:</span>{" "}
                      {trait.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedSubancestry && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedSubancestry.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.isArray(selectedSubancestry.ability_bonuses) && selectedSubancestry.ability_bonuses.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Additional Bonuses</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSubancestry.ability_bonuses.map((bonus: any, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {bonus.ability?.toUpperCase()} +{bonus.bonus}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selectedSubancestry.traits) && selectedSubancestry.traits.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Traits</h4>
                <ul className="space-y-2 text-sm">
                  {selectedSubancestry.traits.map((trait: any, idx: number) => (
                    <li key={idx}>
                      <span className="font-medium">{trait.name}:</span>{" "}
                      {trait.description}
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

export default StepAncestry;
