import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";
import { SRD, type SrdClassFeature, type SrdSubclassFeature } from "@/lib/srd/SRDClient";
import { AlertCircle, Sparkles, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import FeatureChoiceDialog from "./FeatureChoiceDialog";

const StepFeatures = () => {
  const [draft, setDraft] = useAtom(draftAtom);
  const [classFeatures, setClassFeatures] = useState<SrdClassFeature[]>([]);
  const [subclassFeatures, setSubclassFeatures] = useState<SrdSubclassFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
  const [activeFeatureForChoice, setActiveFeatureForChoice] = useState<{
    id: string;
    name: string;
    choices: any;
  } | null>(null);

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
        } else {
          setSubclassFeatures([]);
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

  // Upcoming features (next 3 levels)
  const upcomingFeatures = useMemo(() => {
    const upcoming: Array<{ level: number; name: string; source: string }> = [];
    const maxPreviewLevel = Math.min(draft.level + 3, 20);
    
    classFeatures
      .filter(f => f.level > draft.level && f.level <= maxPreviewLevel)
      .forEach(f => upcoming.push({ level: f.level, name: f.name, source: draft.className || "Class" }));
    
    subclassFeatures
      .filter(f => f.level > draft.level && f.level <= maxPreviewLevel)
      .forEach(f => upcoming.push({ level: f.level, name: f.name, source: "Subclass" }));
    
    return upcoming.sort((a, b) => a.level - b.level);
  }, [classFeatures, subclassFeatures, draft.level, draft.className]);

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

  // Granted features from ancestry/background
  const grantedFeatures = draft.grants.features || [];

  const toggleExpanded = (featureId: string) => {
    setExpandedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  };

  const handleOpenChoices = (feature: SrdClassFeature | SrdSubclassFeature) => {
    if (feature.choices && Object.keys(feature.choices).length > 0) {
      setActiveFeatureForChoice({
        id: feature.id,
        name: feature.name,
        choices: feature.choices,
      });
      setChoiceDialogOpen(true);
    }
  };

  const handleChoiceConfirm = (selections: Record<string, string>) => {
    if (!activeFeatureForChoice) return;
    
    setDraft(prev => ({
      ...prev,
      choices: {
        ...prev.choices,
        featureChoices: {
          ...prev.choices.featureChoices,
          [activeFeatureForChoice.id]: Object.values(selections),
        },
      },
    }));
    setActiveFeatureForChoice(null);
  };

  const parseChoicesForDialog = (choices: any) => {
    if (!choices) return [];
    
    // Handle different choice formats
    if (Array.isArray(choices)) {
      return [{ key: "selection", options: choices, description: "Choose one:" }];
    }
    
    if (typeof choices === "object") {
      return Object.entries(choices).map(([key, value]: [string, any]) => ({
        key,
        options: Array.isArray(value) ? value : value?.options || [],
        description: value?.description || `Choose ${key}:`,
      }));
    }
    
    return [];
  };

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
            No class features data available yet. Visit /admin to seed SRD data.
            Your character will still be created successfully.
          </AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="h-[450px]">
          <div className="space-y-4 pr-4">
            {/* Features grouped by level */}
            {Object.entries(groupedFeatures)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, features]) => (
                <Card key={level}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      Level {level}
                      <Badge variant="outline" className="ml-auto">
                        {features.class.length + features.subclass.length} feature(s)
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {/* Class features */}
                    {features.class.map((feature) => {
                      const isExpanded = expandedFeatures.has(feature.id);
                      const hasChoices = feature.choices && Object.keys(feature.choices).length > 0;
                      const madeChoices = draft.choices.featureChoices[feature.id];

                      return (
                        <Collapsible key={feature.id} open={isExpanded} onOpenChange={() => toggleExpanded(feature.id)}>
                          <div className="border-l-2 border-primary pl-3 py-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded p-1 -m-1">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="font-medium flex-1">{feature.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {draft.className}
                                </Badge>
                              </button>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="mt-2">
                              {feature.description && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {feature.description}
                                </p>
                              )}
                              
                              {hasChoices && (
                                <div className="mt-3 flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenChoices(feature);
                                    }}
                                  >
                                    <Settings2 className="h-4 w-4 mr-1" />
                                    {madeChoices ? "Edit Choice" : "Make Choice"}
                                  </Button>
                                  {madeChoices && (
                                    <Badge variant="default" className="text-xs">
                                      {Array.isArray(madeChoices) ? madeChoices.join(", ") : madeChoices}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}

                    {/* Subclass features */}
                    {features.subclass.map((feature) => {
                      const isExpanded = expandedFeatures.has(feature.id);
                      const hasChoices = feature.choices && Object.keys(feature.choices).length > 0;
                      const madeChoices = draft.choices.featureChoices[feature.id];

                      return (
                        <Collapsible key={feature.id} open={isExpanded} onOpenChange={() => toggleExpanded(feature.id)}>
                          <div className="border-l-2 border-accent pl-3 py-2">
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded p-1 -m-1">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="font-medium flex-1">{feature.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  Subclass
                                </Badge>
                              </button>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="mt-2">
                              {feature.description && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {feature.description}
                                </p>
                              )}
                              
                              {hasChoices && (
                                <div className="mt-3 flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenChoices(feature);
                                    }}
                                  >
                                    <Settings2 className="h-4 w-4 mr-1" />
                                    {madeChoices ? "Edit Choice" : "Make Choice"}
                                  </Button>
                                  {madeChoices && (
                                    <Badge variant="default" className="text-xs">
                                      {Array.isArray(madeChoices) ? madeChoices.join(", ") : madeChoices}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}

            {/* Granted features (from ancestry/background) */}
            {grantedFeatures.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Additional Features</CardTitle>
                  <CardDescription>From ancestry, background, and other sources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {grantedFeatures.map((feature, idx) => (
                    <div key={idx} className="border-l-2 border-muted pl-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{feature.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {feature.source}
                        </Badge>
                      </div>
                      {feature.description && (
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Upcoming features preview */}
            {upcomingFeatures.length > 0 && (
              <Card className="border-dashed">
                <CardHeader className="py-3">
                  <CardTitle className="text-base text-muted-foreground">Coming Up</CardTitle>
                  <CardDescription>Features you'll gain at higher levels</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {upcomingFeatures.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">Lv {f.level}</Badge>
                        <span>{f.name}</span>
                        <span className="text-xs">({f.source})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Feature Choice Dialog */}
      {activeFeatureForChoice && (
        <FeatureChoiceDialog
          open={choiceDialogOpen}
          onOpenChange={setChoiceDialogOpen}
          featureName={activeFeatureForChoice.name}
          choices={parseChoicesForDialog(activeFeatureForChoice.choices)}
          currentSelections={
            draft.choices.featureChoices[activeFeatureForChoice.id]
              ? { selection: draft.choices.featureChoices[activeFeatureForChoice.id][0] }
              : {}
          }
          onConfirm={handleChoiceConfirm}
        />
      )}
    </div>
  );
};

export default StepFeatures;
