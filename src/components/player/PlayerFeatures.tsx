import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Zap, Award, Dna, Sparkles, Target, MapPin, Swords } from "lucide-react";
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

interface AncestryTrait {
  name: string;
  description: string;
}

interface FeatureChoice {
  id: string;
  choice_key: string;
  value_json: any;
  level_gained: number;
}

interface PlayerFeaturesProps {
  characterId: string;
}

export function PlayerFeatures({ characterId }: PlayerFeaturesProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [feats, setFeats] = useState<Feat[]>([]);
  const [featureChoices, setFeatureChoices] = useState<FeatureChoice[]>([]);
  const [ancestryTraits, setAncestryTraits] = useState<AncestryTrait[]>([]);
  const [subancestryTraits, setSubancestryTraits] = useState<AncestryTrait[]>([]);
  const [ancestryName, setAncestryName] = useState<string>("");
  const [subancestryName, setSubancestryName] = useState<string>("");
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedFeat, setSelectedFeat] = useState<Feat | null>(null);
  const [selectedTrait, setSelectedTrait] = useState<AncestryTrait | null>(null);
  const [traitSource, setTraitSource] = useState<string>("");

  useEffect(() => {
    fetchAllData();

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

  const fetchAllData = async () => {
    await Promise.all([
      fetchFeatures(),
      fetchFeats(),
      fetchAncestryTraits(),
      fetchFeatureChoices(),
    ]);
  };

  const fetchFeatureChoices = async () => {
    const { data } = await supabase
      .from("character_feature_choices")
      .select("*")
      .eq("character_id", characterId)
      .order("level_gained");
    
    if (data) setFeatureChoices(data);
  };

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

  const fetchAncestryTraits = async () => {
    // Get character's ancestry and subancestry IDs
    const { data: char } = await supabase
      .from("characters")
      .select("ancestry_id, subancestry_id")
      .eq("id", characterId)
      .single();

    if (!char) return;

    // Fetch ancestry traits
    if (char.ancestry_id) {
      const { data: ancestry } = await supabase
        .from("srd_ancestries")
        .select("name, traits")
        .eq("id", char.ancestry_id)
        .single();

      if (ancestry) {
        setAncestryName(ancestry.name);
        const traits = ancestry.traits as any;
        if (Array.isArray(traits)) {
          setAncestryTraits(traits);
        } else if (traits && typeof traits === 'object') {
          // Handle object format
          const traitList = Object.entries(traits).map(([name, desc]) => ({
            name,
            description: typeof desc === 'string' ? desc : JSON.stringify(desc)
          }));
          setAncestryTraits(traitList);
        }
      }
    }

    // Fetch subancestry traits
    if (char.subancestry_id) {
      const { data: subancestry } = await supabase
        .from("srd_subancestries")
        .select("name, traits")
        .eq("id", char.subancestry_id)
        .single();

      if (subancestry) {
        setSubancestryName(subancestry.name);
        const traits = subancestry.traits as any;
        if (Array.isArray(traits)) {
          setSubancestryTraits(traits);
        } else if (traits && typeof traits === 'object') {
          const traitList = Object.entries(traits).map(([name, desc]) => ({
            name,
            description: typeof desc === 'string' ? desc : JSON.stringify(desc)
          }));
          setSubancestryTraits(traitList);
        }
      }
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'Class': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Subclass': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Ancestry': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Subancestry': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      'Background': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'Feat': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    return colors[source] || 'bg-muted';
  };

  const groupFeaturesBySource = () => {
    const grouped: Record<string, Feature[]> = {};
    features.forEach(feature => {
      if (!grouped[feature.source]) grouped[feature.source] = [];
      grouped[feature.source].push(feature);
    });
    return grouped;
  };

  const featuresBySource = groupFeaturesBySource();
  const hasAncestryTraits = ancestryTraits.length > 0 || subancestryTraits.length > 0;
  const hasFeatureChoices = featureChoices.length > 0;

  // Group feature choices by type for display
  const groupedChoices = featureChoices.reduce((acc, choice) => {
    if (!acc[choice.choice_key]) acc[choice.choice_key] = [];
    acc[choice.choice_key].push(choice);
    return acc;
  }, {} as Record<string, FeatureChoice[]>);

  const getChoiceLabel = (key: string) => {
    const labels: Record<string, string> = {
      'fighting_style': 'Fighting Style',
      'expertise': 'Expertise',
      'metamagic': 'Metamagic',
      'pact_boon': 'Pact Boon',
      'invocation': 'Eldritch Invocations',
      'magical_secrets': 'Magical Secrets',
      'favored_enemy': 'Favored Enemies',
      'favored_terrain': 'Favored Terrains',
    };
    return labels[key] || key;
  };

  const getChoiceIcon = (key: string) => {
    if (key === 'fighting_style') return <Swords className="w-4 h-4" />;
    if (key === 'favored_enemy') return <Target className="w-4 h-4" />;
    if (key === 'favored_terrain') return <MapPin className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Feature Choices (Fighting Style, Expertise, etc.) */}
        {hasFeatureChoices && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Class Choices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(groupedChoices).map(([key, choices]) => (
                  <div key={key} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      {getChoiceIcon(key)}
                      <span className="font-medium text-sm">{getChoiceLabel(key)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {choices.map((choice, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {choice.value_json?.name || choice.value_json?.skill || 'Selected'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ancestry & Racial Traits */}
        {hasAncestryTraits && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Dna className="w-5 h-5 text-green-400" />
                Ancestry Traits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Ancestry Traits */}
                {ancestryTraits.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getSourceColor('Ancestry')}>{ancestryName}</Badge>
                    </div>
                    <div className="space-y-2">
                      {ancestryTraits.map((trait, idx) => (
                        <Card
                          key={idx}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => {
                            setSelectedTrait(trait);
                            setTraitSource(ancestryName);
                          }}
                        >
                          <CardContent className="p-3">
                            <h5 className="font-semibold text-sm">{trait.name}</h5>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {trait.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subancestry Traits */}
                {subancestryTraits.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getSourceColor('Subancestry')}>{subancestryName}</Badge>
                    </div>
                    <div className="space-y-2">
                      {subancestryTraits.map((trait, idx) => (
                        <Card
                          key={idx}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => {
                            setSelectedTrait(trait);
                            setTraitSource(subancestryName);
                          }}
                        >
                          <CardContent className="p-3">
                            <h5 className="font-semibold text-sm">{trait.name}</h5>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {trait.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class & Subclass Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
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
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {Object.entries(featuresBySource)
                    .sort(([a], [b]) => {
                      const order = ['Class', 'Subclass', 'Background'];
                      return order.indexOf(a) - order.indexOf(b);
                    })
                    .map(([source, sourceFeatures]) => (
                      <div key={source}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSourceColor(source)}>{source}</Badge>
                          <Separator className="flex-1" />
                        </div>
                        <div className="space-y-2">
                          {sourceFeatures.map((feature) => (
                            <Card
                              key={feature.id}
                              className="cursor-pointer hover:border-primary transition-colors"
                              onClick={() => setSelectedFeature(feature)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-semibold text-sm">{feature.name}</h5>
                                      <Badge variant="outline" className="text-[10px]">
                                        Lvl {feature.level}
                                      </Badge>
                                    </div>
                                    {feature.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                        {feature.description}
                                      </p>
                                    )}
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
              <Award className="w-5 h-5 text-yellow-400" />
              Feats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No feats chosen yet</p>
                <p className="text-xs mt-1">Feats are typically gained at levels 4, 8, 12, 16, and 19</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
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

      {/* Ancestry Trait Detail Dialog */}
      <Dialog open={!!selectedTrait} onOpenChange={() => setSelectedTrait(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTrait && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <Dna className="w-5 h-5" />
                  {selectedTrait.name}
                  <Badge className={getSourceColor('Ancestry')}>
                    {traitSource}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{selectedTrait.description}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
