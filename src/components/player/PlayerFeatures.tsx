import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Zap, Award, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Feature {
  id: string;
  name: string;
  source: string;
  level: number;
  description: string;
  data: any;
}

interface Feat {
  id: string;
  level_gained: number;
  srd_feats: {
    name: string;
    description: string;
    prerequisite?: string;
  };
}

interface PlayerFeaturesProps {
  characterId: string;
}

export function PlayerFeatures({ characterId }: PlayerFeaturesProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [feats, setFeats] = useState<Feat[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedFeat, setSelectedFeat] = useState<Feat | null>(null);

  useEffect(() => {
    fetchFeatures();
    fetchFeats();

    const channel = supabase
      .channel(`player-features:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_features',
          filter: `character_id=eq.${characterId}`,
        },
        () => fetchFeatures()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_feats',
          filter: `character_id=eq.${characterId}`,
        },
        () => fetchFeats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const fetchFeatures = async () => {
    const { data } = await supabase
      .from("character_features")
      .select("*")
      .eq("character_id", characterId)
      .order("level", { ascending: true })
      .order("name");

    if (data) {
      setFeatures(data);
    }
  };

  const fetchFeats = async () => {
    const { data } = await supabase
      .from("character_feats")
      .select(`
        *,
        srd_feats(name, description, prerequisite)
      `)
      .eq("character_id", characterId)
      .order("level_gained");

    if (data) {
      setFeats(data as any);
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'Class': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Subclass': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Ancestry': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Background': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
    return colors[source] || 'bg-muted';
  };

  const groupFeaturesByLevel = () => {
    return features.reduce((acc, feature) => {
      if (!acc[feature.level]) acc[feature.level] = [];
      acc[feature.level].push(feature);
      return acc;
    }, {} as Record<number, Feature[]>);
  };

  const featuresByLevel = groupFeaturesByLevel();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Class Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Class Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            {features.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No class features yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {Object.entries(featuresByLevel)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([level, levelFeatures]) => (
                      <div key={level}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Level {level}</Badge>
                          <Separator className="flex-1" />
                        </div>
                        <div className="space-y-2">
                          {levelFeatures.map((feature) => (
                            <Card
                              key={feature.id}
                              className="cursor-pointer hover:border-primary transition-colors"
                              onClick={() => setSelectedFeature(feature)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold mb-1">{feature.name}</h5>
                                    <Badge className={getSourceColor(feature.source)}>
                                      {feature.source}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Feats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5" />
              Feats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No feats chosen yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {feats.map((feat) => (
                    <Card
                      key={feat.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedFeat(feat)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold">{feat.srd_feats.name}</h5>
                              <Badge variant="outline" className="text-xs">
                                Level {feat.level_gained}
                              </Badge>
                            </div>
                            {feat.srd_feats.prerequisite && (
                              <p className="text-xs text-muted-foreground">
                                Prerequisite: {feat.srd_feats.prerequisite}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Detail Dialog */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedFeature && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <Zap className="w-5 h-5" />
                  {selectedFeature.name}
                  <Badge className={getSourceColor(selectedFeature.source)}>
                    {selectedFeature.source}
                  </Badge>
                  <Badge variant="outline">Level {selectedFeature.level}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{selectedFeature.description}</p>
                {selectedFeature.data && Object.keys(selectedFeature.data).length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold">Additional Details:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedFeature.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feat Detail Dialog */}
      <Dialog open={!!selectedFeat} onOpenChange={() => setSelectedFeat(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedFeat && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <Award className="w-5 h-5" />
                  {selectedFeat.srd_feats.name}
                  <Badge variant="outline">Level {selectedFeat.level_gained}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {selectedFeat.srd_feats.prerequisite && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Prerequisite:</p>
                    <p className="text-sm">{selectedFeat.srd_feats.prerequisite}</p>
                  </div>
                )}

                <Separator />

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{selectedFeat.srd_feats.description}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
