import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Heart, Shield, Zap, User, BookOpen } from "lucide-react";

interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

interface Skill {
  skill: string;
  proficient: boolean;
  expertise: boolean;
}

interface SpellSlot {
  spell_level: number;
  max_slots: number;
  used_slots: number;
}

interface CharacterData {
  id: string;
  name: string;
  class: string;
  level: number;
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  ac: number;
  speed: number;
  proficiency_bonus: number;
  passive_perception: number;
  str_save: number;
  dex_save: number;
  con_save: number;
  int_save: number;
  wis_save: number;
  cha_save: number;
  resources: any;
}

interface PlayerCharacterSheetProps {
  characterId: string;
}

export function PlayerCharacterSheet({ characterId }: PlayerCharacterSheetProps) {
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [abilities, setAbilities] = useState<AbilityScores | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [spellSlots, setSpellSlots] = useState<SpellSlot[]>([]);

  useEffect(() => {
    fetchCharacter();
    fetchAbilities();
    fetchSkills();
    fetchSpellSlots();

    const channel = supabase
      .channel(`char-sheet:${characterId}`)
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_spell_slots',
          filter: `character_id=eq.${characterId}`,
        },
        () => fetchSpellSlots()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const fetchCharacter = async () => {
    const { data } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (data) setCharacter(data as CharacterData);
  };

  const fetchAbilities = async () => {
    const { data } = await supabase
      .from("character_abilities")
      .select("str, dex, con, int, wis, cha")
      .eq("character_id", characterId)
      .maybeSingle();

    if (data) setAbilities(data);
  };

  const fetchSkills = async () => {
    const { data } = await supabase
      .from("character_skills")
      .select("skill, proficient, expertise")
      .eq("character_id", characterId)
      .order("skill");

    if (data) setSkills(data);
  };

  const fetchSpellSlots = async () => {
    const { data } = await supabase
      .from("character_spell_slots")
      .select("spell_level, max_slots, used_slots")
      .eq("character_id", characterId)
      .order("spell_level");

    if (data) setSpellSlots(data);
  };

  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const formatModifier = (mod: number) => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getSkillModifier = (skill: Skill, abilityScore: number) => {
    const baseMod = getAbilityModifier(abilityScore);
    if (!character) return baseMod;
    
    let bonus = baseMod;
    if (skill.proficient) bonus += character.proficiency_bonus;
    if (skill.expertise) bonus += character.proficiency_bonus;
    return bonus;
  };

  const getSkillAbility = (skillName: string): keyof AbilityScores => {
    const skillMap: Record<string, keyof AbilityScores> = {
      'Acrobatics': 'dex', 'Animal Handling': 'wis', 'Arcana': 'int',
      'Athletics': 'str', 'Deception': 'cha', 'History': 'int',
      'Insight': 'wis', 'Intimidation': 'cha', 'Investigation': 'int',
      'Medicine': 'wis', 'Nature': 'int', 'Perception': 'wis',
      'Performance': 'cha', 'Persuasion': 'cha', 'Religion': 'int',
      'Sleight of Hand': 'dex', 'Stealth': 'dex', 'Survival': 'wis'
    };
    return skillMap[skillName] || 'str';
  };

  if (!character) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Loading character...</p>
      </div>
    );
  }

  const getHPPercentage = () => {
    return (character.current_hp / character.max_hp) * 100;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5" />
          {character.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Level {character.level} {character.class}
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-4 pr-4">
            {/* HP */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-status-hp" />
                <span className="font-semibold">Hit Points</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold tabular-nums">
                    {character.current_hp}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    / {character.max_hp}
                  </span>
                </div>
                <Progress value={getHPPercentage()} className="h-2" />
                {character.temp_hp > 0 && (
                  <Badge variant="outline" className="bg-secondary/10 border-secondary">
                    +{character.temp_hp} Temporary HP
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Core Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">AC</div>
                  <div className="text-lg font-bold">{character.ac}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Speed</div>
                  <div className="text-lg font-bold">{character.speed} ft</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Prof Bonus</div>
                <div className="text-lg font-bold">+{character.proficiency_bonus}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Perception</div>
                <div className="text-lg font-bold">{character.passive_perception}</div>
              </div>
            </div>

            <Separator />

            {/* Ability Scores */}
            {abilities && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-semibold">Ability Scores</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(abilities).map(([key, value]) => (
                    <div key={key} className="text-center p-2 bg-muted/30 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase">{key}</div>
                      <div className="text-xl font-bold">{value}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatModifier(getAbilityModifier(value))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Saving Throws */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4" />
                <span className="font-semibold">Saving Throws</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strength</span>
                  <span className="font-mono">
                    {character.str_save >= 0 ? '+' : ''}{character.str_save}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dexterity</span>
                  <span className="font-mono">
                    {character.dex_save >= 0 ? '+' : ''}{character.dex_save}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Constitution</span>
                  <span className="font-mono">
                    {character.con_save >= 0 ? '+' : ''}{character.con_save}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Intelligence</span>
                  <span className="font-mono">
                    {character.int_save >= 0 ? '+' : ''}{character.int_save}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wisdom</span>
                  <span className="font-mono">
                    {character.wis_save >= 0 ? '+' : ''}{character.wis_save}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Charisma</span>
                  <span className="font-mono">
                    {character.cha_save >= 0 ? '+' : ''}{character.cha_save}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Skills */}
            {skills.length > 0 && abilities && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold">Skills</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {skills.map((skill) => {
                    const abilityKey = getSkillAbility(skill.skill);
                    const abilityScore = abilities[abilityKey];
                    const modifier = getSkillModifier(skill, abilityScore);
                    
                    return (
                      <div key={skill.skill} className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          {skill.skill}
                          {skill.expertise && <Badge variant="outline" className="text-[10px] h-4 px-1">E</Badge>}
                          {skill.proficient && !skill.expertise && <span className="text-xs">●</span>}
                        </span>
                        <span className="font-mono">{formatModifier(modifier)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Spell Slots */}
            {spellSlots.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-semibold">Spell Slots</span>
                  </div>
                  <div className="space-y-2">
                    {spellSlots.map((slot) => (
                      <div key={slot.spell_level} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Level {slot.spell_level}
                        </span>
                        <div className="flex gap-1">
                          {Array.from({ length: slot.max_slots }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full border-2 ${
                                i < slot.max_slots - slot.used_slots
                                  ? 'bg-primary border-primary'
                                  : 'bg-muted border-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Resources */}
            {character.resources && Object.keys(character.resources).length > 0 && (
              <>
                <Separator />
                <div>
                  <span className="font-semibold">Resources</span>
                  <div className="mt-2 space-y-2">
                    {Object.entries(character.resources).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="outline">
                          {value.current}/{value.max}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
