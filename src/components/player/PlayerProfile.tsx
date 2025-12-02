import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  User, Heart, Lightbulb, Link2, AlertTriangle, 
  Ruler, Eye, Palette, Languages, BookText, Scroll
} from "lucide-react";

interface CharacterProfile {
  id: string;
  name: string;
  class: string;
  level: number;
  alignment: string | null;
  age: string | null;
  height: string | null;
  weight: string | null;
  eyes: string | null;
  skin: string | null;
  hair: string | null;
  personality_traits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  notes: string | null;
  ancestry_id: string | null;
  background_id: string | null;
}

interface BackgroundInfo {
  name: string;
  feature: any | null;
}

interface AncestryInfo {
  name: string;
}

interface Language {
  name: string;
}

interface PlayerProfileProps {
  characterId: string;
}

export function PlayerProfile({ characterId }: PlayerProfileProps) {
  const [character, setCharacter] = useState<CharacterProfile | null>(null);
  const [background, setBackground] = useState<BackgroundInfo | null>(null);
  const [ancestry, setAncestry] = useState<AncestryInfo | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel(`player-profile:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`,
        },
        () => fetchCharacter()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchCharacter(),
      fetchLanguages(),
    ]);
  };

  const fetchCharacter = async () => {
    const { data } = await supabase
      .from("characters")
      .select(`
        id, name, class, level, alignment, age, height, weight, 
        eyes, skin, hair, personality_traits, ideals, bonds, flaws, notes,
        ancestry_id, background_id
      `)
      .eq("id", characterId)
      .single();

    if (data) {
      setCharacter(data);
      
      // Fetch related data
      if (data.background_id) {
        const { data: bg } = await supabase
          .from("srd_backgrounds")
          .select("name, feature")
          .eq("id", data.background_id)
          .single();
        if (bg) setBackground(bg);
      }

      if (data.ancestry_id) {
        const { data: anc } = await supabase
          .from("srd_ancestries")
          .select("name")
          .eq("id", data.ancestry_id)
          .single();
        if (anc) setAncestry(anc);
      }
    }
  };

  const fetchLanguages = async () => {
    const { data } = await supabase
      .from("character_languages")
      .select("name")
      .eq("character_id", characterId)
      .order("name");

    if (data) setLanguages(data);
  };

  if (!character) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const hasPersonality = character.personality_traits || character.ideals || character.bonds || character.flaws;
  const hasPhysical = character.age || character.height || character.weight || character.eyes || character.skin || character.hair;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold">{character.name}</h3>
            <p className="text-muted-foreground">
              Level {character.level} {character.class}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {ancestry && (
              <div>
                <span className="text-muted-foreground">Ancestry</span>
                <p className="font-medium">{ancestry.name}</p>
              </div>
            )}
            {background && (
              <div>
                <span className="text-muted-foreground">Background</span>
                <p className="font-medium">{background.name}</p>
              </div>
            )}
            {character.alignment && (
              <div>
                <span className="text-muted-foreground">Alignment</span>
                <p className="font-medium">{character.alignment}</p>
              </div>
            )}
          </div>

          {/* Languages */}
          {languages.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="w-4 h-4" />
                  <span className="font-semibold text-sm">Languages</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {languages.map((lang) => (
                    <Badge key={lang.name} variant="outline" className="text-xs">
                      {lang.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Physical Description */}
      {hasPhysical && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {character.age && (
                <div>
                  <span className="text-muted-foreground">Age</span>
                  <p className="font-medium">{character.age}</p>
                </div>
              )}
              {character.height && (
                <div>
                  <span className="text-muted-foreground">Height</span>
                  <p className="font-medium">{character.height}</p>
                </div>
              )}
              {character.weight && (
                <div>
                  <span className="text-muted-foreground">Weight</span>
                  <p className="font-medium">{character.weight}</p>
                </div>
              )}
              {character.eyes && (
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Eyes</span>
                    <p className="font-medium">{character.eyes}</p>
                  </div>
                </div>
              )}
              {character.skin && (
                <div className="flex items-start gap-2">
                  <Palette className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Skin</span>
                    <p className="font-medium">{character.skin}</p>
                  </div>
                </div>
              )}
              {character.hair && (
                <div>
                  <span className="text-muted-foreground">Hair</span>
                  <p className="font-medium">{character.hair}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personality Traits */}
      {hasPersonality && (
        <Card className={!hasPhysical ? "md:col-span-2" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              Personality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {character.personality_traits && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">Personality Traits</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                      {character.personality_traits}
                    </p>
                  </div>
                )}

                {character.ideals && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      <span className="font-semibold text-sm">Ideals</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                      {character.ideals}
                    </p>
                  </div>
                )}

                {character.bonds && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-sm">Bonds</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                      {character.bonds}
                    </p>
                  </div>
                )}

                {character.flaws && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="font-semibold text-sm">Flaws</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                      {character.flaws}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Background Feature */}
      {background?.feature && (
        <Card className={!hasPersonality && !hasPhysical ? "md:col-span-2" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookText className="w-5 h-5 text-amber-400" />
              Background Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                  {background.name}
                </Badge>
              </div>
              {typeof background.feature === 'object' && background.feature?.name && (
                <h4 className="font-semibold">{background.feature.name}</h4>
              )}
              {typeof background.feature === 'object' && background.feature?.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {background.feature.description}
                </p>
              ) : typeof background.feature === 'string' ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {background.feature}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Character Notes */}
      {character.notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scroll className="w-5 h-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{character.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
