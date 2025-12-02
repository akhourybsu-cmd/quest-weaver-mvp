import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAtom } from "jotai";
import { draftAtom, setEquipmentBundleAtom } from "@/state/characterWizard";
import { SRD, type SrdClass } from "@/lib/srd/SRDClient";
import { getEquipmentBundlesForClass, type EquipmentBundle } from "@/data/srd/equipmentBundlesSeed";
import { Check, Package, Swords, Shield } from "lucide-react";

const StepEquipment = () => {
  const [draft] = useAtom(draftAtom);
  const [, setEquipmentBundle] = useAtom(setEquipmentBundleAtom);
  const [currentClass, setCurrentClass] = useState<SrdClass | null>(null);
  const [bundles, setBundles] = useState<EquipmentBundle[]>([]);

  useEffect(() => {
    const loadClassEquipment = async () => {
      if (!draft.classId) return;
      
      const classes = await SRD.classes();
      const cls = classes.find(c => c.id === draft.classId);
      if (cls) {
        setCurrentClass(cls);
        
        // First try to get bundles from our seed data
        const seedData = getEquipmentBundlesForClass(cls.name);
        if (seedData && seedData.bundles.length > 0) {
          setBundles(seedData.bundles);
          return;
        }
        
        // Fallback to database starting_equipment if available
        const equipment = cls.starting_equipment as any;
        if (equipment?.bundles && Array.isArray(equipment.bundles)) {
          setBundles(equipment.bundles);
        } else if (equipment?.default) {
          setBundles([{ 
            id: "default", 
            label: "Standard Equipment", 
            items: Array.isArray(equipment.default) 
              ? equipment.default.map((i: any) => typeof i === 'string' ? { name: i } : i)
              : []
          }]);
        } else {
          // Use seed data default
          if (seedData) {
            setBundles([{
              id: "default",
              label: "Standard Equipment",
              items: seedData.default
            }]);
          } else {
            setBundles([{ id: "basic", label: "Basic Equipment", items: [] }]);
          }
        }
      }
    };

    loadClassEquipment();
  }, [draft.classId]);

  // Auto-select first bundle if none selected
  useEffect(() => {
    if (bundles.length > 0 && !draft.choices.equipmentBundleId) {
      setEquipmentBundle(bundles[0].id);
    }
  }, [bundles, draft.choices.equipmentBundleId, setEquipmentBundle]);

  const handleBundleSelect = (bundleId: string) => {
    setEquipmentBundle(bundleId);
  };

  const getItemIcon = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes("armor") || name.includes("mail") || name.includes("shield")) {
      return <Shield className="h-3 w-3" />;
    }
    if (name.includes("sword") || name.includes("axe") || name.includes("weapon") || name.includes("bow") || name.includes("dagger")) {
      return <Swords className="h-3 w-3" />;
    }
    return <Package className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Starting Equipment
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose your starting equipment package for your {currentClass?.name || "class"}.
        </p>
      </div>

      {bundles.length > 0 ? (
        <div className="space-y-3">
          {bundles.map((bundle) => {
            const isSelected = draft.choices.equipmentBundleId === bundle.id;
            
            return (
              <Card
                key={bundle.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-muted/50 hover:border-primary/50"
                }`}
                onClick={() => handleBundleSelect(bundle.id)}
              >
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{bundle.label}</span>
                    {isSelected && (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        Selected
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {bundle.items && bundle.items.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {bundle.items.map((item, idx) => (
                        <Badge 
                          key={idx} 
                          variant={isSelected ? "secondary" : "outline"}
                          className="gap-1"
                        >
                          {getItemIcon(item.name)}
                          {item.name}
                          {item.qty && item.qty > 1 && (
                            <span className="text-muted-foreground">×{item.qty}</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Standard starting equipment for your class.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Loading equipment options...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Equipment Notes */}
      <Card className="border-dashed">
        <CardHeader className="py-3">
          <CardTitle className="text-sm text-muted-foreground">Equipment Notes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground space-y-2">
          <p>• "Any Martial/Simple Weapon" choices can be specified after character creation</p>
          <p>• Packs contain standard adventuring gear (see PHB for contents)</p>
          <p>• You can also roll for starting gold instead (optional rule)</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepEquipment;
