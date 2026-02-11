import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield } from "lucide-react";

interface SubclassOption {
  id: string;
  name: string;
  description: string | null;
}

interface SubclassSelectionStepProps {
  className: string;
  selectedSubclassId: string | null;
  onSelect: (subclassId: string) => void;
}

export const SubclassSelectionStep = ({
  className,
  selectedSubclassId,
  onSelect,
}: SubclassSelectionStepProps) => {
  const [subclasses, setSubclasses] = useState<SubclassOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Get class id first
      const { data: cls } = await supabase
        .from("srd_classes")
        .select("id")
        .eq("name", className)
        .single();

      if (!cls) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("srd_subclasses")
        .select("id, name, description")
        .eq("class_id", cls.id)
        .order("name");

      setSubclasses(data || []);
      setLoading(false);
    };
    load();
  }, [className]);

  const subclassLabel = getSubclassLabel(className);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading subclasses...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Choose Your {subclassLabel}
        </CardTitle>
        <CardDescription>
          Select a {subclassLabel.toLowerCase()} to specialize your {className}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {subclasses.map((sc) => {
              const isSelected = selectedSubclassId === sc.id;
              return (
                <div
                  key={sc.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onClick={() => onSelect(sc.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{sc.name}</h4>
                    {isSelected && <Badge>Selected</Badge>}
                  </div>
                  {sc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {sc.description}
                    </p>
                  )}
                </div>
              );
            })}
            {subclasses.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No subclasses found for {className}. Check SRD data seeding.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

function getSubclassLabel(className: string): string {
  const labels: Record<string, string> = {
    Barbarian: "Primal Path",
    Bard: "Bard College",
    Cleric: "Divine Domain",
    Druid: "Druid Circle",
    Fighter: "Martial Archetype",
    Monk: "Monastic Tradition",
    Paladin: "Sacred Oath",
    Ranger: "Ranger Archetype",
    Rogue: "Roguish Archetype",
    Sorcerer: "Sorcerous Origin",
    Warlock: "Otherworldly Patron",
    Wizard: "Arcane Tradition",
  };
  return labels[className] || "Subclass";
}
