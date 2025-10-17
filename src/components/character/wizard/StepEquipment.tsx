import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { draftAtom, setEquipmentBundleAtom } from "@/state/characterWizard";
import { SRD, type SrdClass } from "@/lib/srd/SRDClient";
import { Check } from "lucide-react";

const StepEquipment = () => {
  const [draft] = useAtom(draftAtom);
  const [, setEquipmentBundle] = useAtom(setEquipmentBundleAtom);
  const [currentClass, setCurrentClass] = useState<SrdClass | null>(null);
  const [bundles, setBundles] = useState<any[]>([]);

  useEffect(() => {
    const loadClassEquipment = async () => {
      if (!draft.classId) return;
      
      const classes = await SRD.classes();
      const cls = classes.find(c => c.id === draft.classId);
      if (cls) {
        setCurrentClass(cls);
        // Parse starting equipment into bundles
        const equipment = cls.starting_equipment as any;
        if (equipment?.bundles && Array.isArray(equipment.bundles)) {
          setBundles(equipment.bundles);
        } else if (equipment?.default) {
          // If no bundles, create a single default bundle
          setBundles([{ id: "default", label: "Standard Equipment", items: equipment.default }]);
        } else {
          // Fallback: create a basic bundle
          setBundles([{ id: "basic", label: "Basic Equipment", items: [] }]);
        }
      }
    };

    loadClassEquipment();
  }, [draft.classId]);

  const handleBundleSelect = (bundleId: string) => {
    setEquipmentBundle(bundleId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Starting Equipment</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose your starting equipment package for your {currentClass?.name || "class"}.
        </p>
      </div>

      {bundles.length > 0 ? (
        <div className="space-y-4">
          {bundles.map((bundle) => (
            <Card
              key={bundle.id}
              className={`cursor-pointer transition-colors ${
                draft.choices.equipmentBundleId === bundle.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => handleBundleSelect(bundle.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{bundle.label || `Option ${bundle.id}`}</span>
                  {draft.choices.equipmentBundleId === bundle.id && (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" />
                      Selected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bundle.items && Array.isArray(bundle.items) && bundle.items.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {bundle.items.map((item: any, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {typeof item === "string" ? item : item.name || "Item"}
                        {item.qty && item.qty > 1 ? ` ×${item.qty}` : ""}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {bundle.description || "Standard starting equipment for your class."}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No equipment bundles available. You'll receive standard starting equipment.
            </p>
            <Button
              className="mt-4"
              onClick={() => handleBundleSelect("default")}
              variant={draft.choices.equipmentBundleId ? "outline" : "default"}
            >
              {draft.choices.equipmentBundleId ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Default Equipment Selected
                </>
              ) : (
                "Select Default Equipment"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepEquipment;
