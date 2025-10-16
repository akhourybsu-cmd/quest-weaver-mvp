import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "../CharacterWizard";

interface StepAncestryProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const StepAncestry = ({ data, updateData }: StepAncestryProps) => {
  const [ancestries, setAncestries] = useState<any[]>([]);
  const [subancestries, setSubancestries] = useState<any[]>([]);
  const [selectedAncestry, setSelectedAncestry] = useState<any>(null);
  const [selectedSubancestry, setSelectedSubancestry] = useState<any>(null);

  useEffect(() => {
    loadAncestries();
  }, []);

  useEffect(() => {
    if (data.ancestryId) {
      loadSubancestries(data.ancestryId);
      const ancestry = ancestries.find(a => a.id === data.ancestryId);
      setSelectedAncestry(ancestry);
    }
  }, [data.ancestryId, ancestries]);

  useEffect(() => {
    if (data.subancestryId) {
      const subancestry = subancestries.find(s => s.id === data.subancestryId);
      setSelectedSubancestry(subancestry);
    }
  }, [data.subancestryId, subancestries]);

  const loadAncestries = async () => {
    const { data: ancestryData, error } = await supabase
      .from("srd_ancestries")
      .select("*")
      .order("name");
      
    if (!error && ancestryData) {
      setAncestries(ancestryData);
    }
  };

  const loadSubancestries = async (ancestryId: string) => {
    const { data: subancestryData, error } = await supabase
      .from("srd_subancestries")
      .select("*")
      .eq("ancestry_id", ancestryId)
      .order("name");
      
    if (!error && subancestryData) {
      setSubancestries(subancestryData);
    }
  };

  const handleAncestryChange = (ancestryId: string) => {
    updateData({ 
      ancestryId,
      subancestryId: undefined // Reset subancestry when ancestry changes
    });
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
          <Select value={data.ancestryId} onValueChange={handleAncestryChange}>
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

        {subancestries.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subancestry">Subancestry</Label>
            <Select 
              value={data.subancestryId || ""} 
              onValueChange={(value) => updateData({ subancestryId: value })}
            >
              <SelectTrigger id="subancestry">
                <SelectValue placeholder="Select subancestry (optional)" />
              </SelectTrigger>
              <SelectContent>
                {subancestries.map((sub) => (
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
