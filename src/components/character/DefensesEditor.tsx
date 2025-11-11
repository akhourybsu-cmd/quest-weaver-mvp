import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, X } from "lucide-react";
import { DamageTypeBadge, DAMAGE_TYPES, type DamageType } from "@/components/combat/DamageTypeSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DefensesEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  currentResistances: DamageType[];
  currentVulnerabilities: DamageType[];
  currentImmunities: DamageType[];
  onUpdate: () => void;
}

export const DefensesEditor = ({
  open,
  onOpenChange,
  characterId,
  currentResistances,
  currentVulnerabilities,
  currentImmunities,
  onUpdate
}: DefensesEditorProps) => {
  const [resistances, setResistances] = useState<DamageType[]>(currentResistances);
  const [vulnerabilities, setVulnerabilities] = useState<DamageType[]>(currentVulnerabilities);
  const [immunities, setImmunities] = useState<DamageType[]>(currentImmunities);
  const [loading, setLoading] = useState(false);

  const [selectedResistance, setSelectedResistance] = useState<DamageType>('fire');
  const [selectedVulnerability, setSelectedVulnerability] = useState<DamageType>('fire');
  const [selectedImmunity, setSelectedImmunity] = useState<DamageType>('fire');

  const addResistance = () => {
    if (!resistances.includes(selectedResistance)) {
      setResistances([...resistances, selectedResistance]);
    }
  };

  const addVulnerability = () => {
    if (!vulnerabilities.includes(selectedVulnerability)) {
      setVulnerabilities([...vulnerabilities, selectedVulnerability]);
    }
  };

  const addImmunity = () => {
    if (!immunities.includes(selectedImmunity)) {
      setImmunities([...immunities, selectedImmunity]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('characters')
        .update({
          resistances: resistances as any,
          vulnerabilities: vulnerabilities as any,
          immunities: immunities as any
        })
        .eq('id', characterId);

      if (error) throw error;

      toast.success('Defenses updated successfully');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating defenses:', error);
      toast.error('Failed to update defenses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Edit Damage Defenses
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Immunities */}
          <div className="space-y-3">
            <Label className="text-blue-600 dark:text-blue-400">Immunities (No Damage)</Label>
            <div className="flex gap-2">
              <Select value={selectedImmunity} onValueChange={(v) => setSelectedImmunity(v as DamageType)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="capitalize">{type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addImmunity} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {immunities.map((type) => (
                <Badge key={type} variant="secondary" className="gap-2">
                  <DamageTypeBadge type={type} variant="secondary" />
                  <button
                    onClick={() => setImmunities(immunities.filter(t => t !== type))}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {immunities.length === 0 && (
                <span className="text-sm text-muted-foreground">No immunities</span>
              )}
            </div>
          </div>

          {/* Resistances */}
          <div className="space-y-3">
            <Label className="text-green-600 dark:text-green-400">Resistances (Half Damage)</Label>
            <div className="flex gap-2">
              <Select value={selectedResistance} onValueChange={(v) => setSelectedResistance(v as DamageType)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="capitalize">{type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addResistance} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {resistances.map((type) => (
                <Badge key={type} variant="outline" className="gap-2">
                  <DamageTypeBadge type={type} variant="outline" />
                  <button
                    onClick={() => setResistances(resistances.filter(t => t !== type))}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {resistances.length === 0 && (
                <span className="text-sm text-muted-foreground">No resistances</span>
              )}
            </div>
          </div>

          {/* Vulnerabilities */}
          <div className="space-y-3">
            <Label className="text-destructive">Vulnerabilities (Double Damage)</Label>
            <div className="flex gap-2">
              <Select value={selectedVulnerability} onValueChange={(v) => setSelectedVulnerability(v as DamageType)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="capitalize">{type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addVulnerability} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {vulnerabilities.map((type) => (
                <Badge key={type} variant="destructive" className="gap-2">
                  <DamageTypeBadge type={type} variant="destructive" />
                  <button
                    onClick={() => setVulnerabilities(vulnerabilities.filter(t => t !== type))}
                    className="hover:text-background"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {vulnerabilities.length === 0 && (
                <span className="text-sm text-muted-foreground">No vulnerabilities</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
