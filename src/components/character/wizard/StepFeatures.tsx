import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";
import { SRD, type SrdClassFeature, type SrdSubclassFeature } from "@/lib/srd/SRDClient";
import { AlertCircle, Sparkles } from "lucide-react";

const StepFeatures = () => {
  const [draft] = useAtom(draftAtom);
  const [classFeatures, setClassFeatures] = useState<SrdClassFeature[]>([]);
  const [subclassFeatures, setSubclassFeatures] = useState<SrdSubclassFeature[]>([]);
  const [loading, setLoading] = useState(true);

  // Load features from SRD
  useEffect(() => {
    const loadFeatures = async () => {
      setLoading(true);
      try {
        if (draft.classId) {
          const features = await SRD.classFeatures(draft.classId);
          setClassFeatures(features);
        }

        if (draft.subclassId) {
          const subFeatures = await SRD.subclassFeatures(draft.subclassId);
          setSubclassFeatures(subFeatures);
        }
      } catch (error) {
        console.error("Error loading features:", error);
      } finally {
        setLoading(false);
      }
    };

    if (draft.classId) {
      loadFeatures();
    }
  }, [draft.classId, draft.subclassId]);

  // Filter features by current level
  const availableClassFeatures = useMemo(() => {
    return classFeatures.filter(f => f.level <= draft.level);
  }, [classFeatures, draft.level]);

  const availableSubclassFeatures = useMemo(() => {
    return subclassFeatures.filter(f => f.level <= draft.level);
  }, [subclassFeatures, draft.level]);

  // Group features by level
  const groupedFeatures = useMemo(() => {
    const grouped: Record<number, { class: SrdClassFeature[]; subclass: SrdSubclassFeature[] }> = {};
    
    availableClassFeatures.forEach(f => {
      if (!grouped[f.level]) grouped[f.level] = { class: [], subclass: [] };
      grouped[f.level].class.push(f);
    });

    availableSubclassFeatures.forEach(f => {
      if (!grouped[f.level]) grouped[f.level] = { class: [], subclass: [] };
      grouped[f.level].subclass.push(f);
    });

    return grouped;
  }, [availableClassFeatures, availableSubclassFeatures]);

  // Also include any manually granted features from wizard state
  const grantedFeatures = draft.grants.features || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading class features...</p>
      </div>
    );
  }

  const hasFeatures = availableClassFeatures.length > 0 || availableSubclassFeatures.length > 0 || grantedFeatures.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Class Features
        </h3>
        <p className="text-sm text-muted-foreground">
          Review your class features. Features are automatically granted based on your {draft.className} level {draft.level}.
        </p>
      </div>

      {!hasFeatures ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No class features data available yet. Features will be populated when SRD data is imported.
            Your character will still be created successfully.
          </AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {/* Features grouped by level */}
            {Object.entries(groupedFeatures)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, features]) => (
                <Card key={level}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      Level {level}
                      <Badge variant="outline" className="ml-auto">
                        {features.class.length + features.subclass.length} features
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Class features */}
                    {features.class.map((feature) => (
                      <div key={feature.id} className="border-l-2 border-primary pl-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{feature.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {draft.className}
                          </Badge>
                        </div>
                        {feature.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {feature.description}
                          </p>
                        )}
                        {feature.choices && Object.keys(feature.choices).length > 0 && (
                          <Badge variant="outline" className="text-xs mt-2">
                            Choices Available
                          </Badge>
                        )}
                      </div>
                    ))}

                    {/* Subclass features */}
                    {features.subclass.map((feature) => (
                      <div key={feature.id} className="border-l-2 border-accent pl-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{feature.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            Subclass
                          </Badge>
                        </div>
                        {feature.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {feature.description}
                          </p>
                        )}
                        {feature.choices && Object.keys(feature.choices).length > 0 && (
                          <Badge variant="outline" className="text-xs mt-2">
                            Choices Available
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

            {/* Manually granted features (from ancestry/background) */}
            {grantedFeatures.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Features</CardTitle>
                  <CardDescription>From ancestry, background, and other sources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {grantedFeatures.map((feature, idx) => (
                    <div key={idx} className="border-l-2 border-muted pl-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{feature.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {feature.source}
                        </Badge>
                      </div>
                      {feature.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default StepFeatures;
