import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Heart, Shield, Zap, User, BookOpen, Languages, 
  ShieldAlert, Wand2, ChevronDown, Sword, Package, Sparkles, Star
} from "lucide-react";

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

interface Proficiency {
  type: string;
  name: string;
}

interface Language {
  name: string;
}

interface CharacterSpell {
  id: string;
  prepared: boolean;
  known: boolean;
  spell: {
    id: string;
    name: string;
    level: number;
    school: string;
    casting_time: string;
    range: string;
    components: string[];
    duration: string;
    concentration: boolean;
    ritual: boolean;
    description: string;
    higher_levels: string | null;
  };
}

interface CharacterFeature {
  id: string;
  name: string;
  source: string;
  level: number;
  description: string | null;
}

interface CharacterResource {
  id: string;
  resource_key: string;
  label: string;
  current_value: number;
  max_value: number;
  recharge: string;
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
  resistances: string[] | null;
  immunities: string[] | null;
  vulnerabilities: string[] | null;
  spell_ability: string | null;
  spell_save_dc: number | null;
  spell_attack_mod: number | null;
  ancestry_id: string | null;
  subancestry_id: string | null;
}

interface PlayerCharacterSheetProps {
  characterId: string;
}

export function PlayerCharacterSheet({ characterId }: PlayerCharacterSheetProps) {
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [abilities, setAbilities] = useState<AbilityScores | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [spellSlots, setSpellSlots] = useState<SpellSlot[]>([]);
  const [proficiencies, setProficiencies] = useState<Proficiency[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [spells, setSpells] = useState<CharacterSpell[]>([]);
  const [features, setFeatures] = useState<CharacterFeature[]>([]);
  const [resources, setResources] = useState<CharacterResource[]>([]);
  const [ancestryTraits, setAncestryTraits] = useState<string[]>([]);
  const [subancestryTraits, setSubancestryTraits] = useState<string[]>([]);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [profOpen, setProfOpen] = useState(false);
  const [spellsOpen, setSpellsOpen] = useState(true);
  const [featuresOpen, setFeaturesOpen] = useState(true);
  const [selectedSpell, setSelectedSpell] = useState<CharacterSpell['spell'] | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<CharacterFeature | null>(null);

  useEffect(() => {
    fetchAllData();

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

  const fetchAllData = async () => {
    await Promise.all([
      fetchCharacter(),
      fetchAbilities(),
      fetchSkills(),
      fetchSpellSlots(),
      fetchProficiencies(),
      fetchLanguages(),
      fetchSpells(),
      fetchFeatures(),
      fetchResources(),
    ]);
  };

  const fetchCharacter = async () => {
    const { data } = await supabase
      .from("characters")
      .select("*, srd_ancestries(traits), srd_subancestries(traits)")
      .eq("id", characterId)
      .single();

    if (data) {
      setCharacter(data as CharacterData);
      // Extract ancestry traits
      if ((data as any).srd_ancestries?.traits) {
        setAncestryTraits((data as any).srd_ancestries.traits);
      }
      if ((data as any).srd_subancestries?.traits) {
        setSubancestryTraits((data as any).srd_subancestries.traits);
      }
    }
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

  const fetchProficiencies = async () => {
    const { data } = await supabase
      .from("character_proficiencies")
      .select("type, name")
      .eq("character_id", characterId)
      .order("type")
      .order("name");

    if (data) setProficiencies(data);
  };

  const fetchLanguages = async () => {
    const { data } = await supabase
      .from("character_languages")
      .select("name")
      .eq("character_id", characterId)
      .order("name");

    if (data) setLanguages(data);
  };

  const fetchSpells = async () => {
    const { data } = await supabase
      .from("character_spells")
      .select(`
        id,
        prepared,
        known,
        spell:srd_spells(
          id,
          name,
          level,
          school,
          casting_time,
          range,
          components,
          duration,
          concentration,
          ritual,
          description,
          higher_levels
        )
      `)
      .eq("character_id", characterId);

    if (data) {
      const validSpells = data.filter(s => s.spell !== null) as CharacterSpell[];
      setSpells(validSpells);
    }
  };

  const fetchFeatures = async () => {
    const { data } = await supabase
      .from("character_features")
      .select("id, name, source, level, description")
      .eq("character_id", characterId)
      .order("level")
      .order("source");

    if (data) setFeatures(data);
  };

  const fetchResources = async () => {
    const { data } = await supabase
      .from("character_resources")
      .select("id, resource_key, label, current_value, max_value, recharge")
      .eq("character_id", characterId)
      .order("label");

    if (data) setResources(data as CharacterResource[]);
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'Class': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Subclass': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Ancestry': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Subancestry': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Background': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Feat': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
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

  const groupProficiencies = () => {
    const grouped: Record<string, string[]> = {};
    proficiencies.forEach(p => {
      if (!grouped[p.type]) grouped[p.type] = [];
      grouped[p.type].push(p.name);
    });
    return grouped;
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

  const groupedProfs = groupProficiencies();
  const hasDefenses = (character.resistances?.length || 0) > 0 || 
                      (character.immunities?.length || 0) > 0 || 
                      (character.vulnerabilities?.length || 0) > 0;
  const hasSpellcasting = character.spell_ability && character.spell_save_dc;

  return (
    <>
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
                <Heart className="w-4 h-4 text-destructive" />
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

            {/* Spellcasting Stats */}
            {hasSpellcasting && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-4 h-4 text-primary" />
                    <span className="font-semibold">Spellcasting</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-primary/10 rounded-lg">
                      <div className="text-xs text-muted-foreground">Ability</div>
                      <div className="text-sm font-bold uppercase">{character.spell_ability}</div>
                    </div>
                    <div className="text-center p-2 bg-primary/10 rounded-lg">
                      <div className="text-xs text-muted-foreground">Save DC</div>
                      <div className="text-lg font-bold">{character.spell_save_dc}</div>
                    </div>
                    <div className="text-center p-2 bg-primary/10 rounded-lg">
                      <div className="text-xs text-muted-foreground">Attack</div>
                      <div className="text-lg font-bold">
                        {character.spell_attack_mod && character.spell_attack_mod >= 0 ? '+' : ''}
                        {character.spell_attack_mod}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Defenses */}
            {hasDefenses && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="font-semibold">Defenses</span>
                  </div>
                  <div className="space-y-2">
                    {character.resistances && character.resistances.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Resistances</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {character.resistances.map((r) => (
                            <Badge key={r} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {character.immunities && character.immunities.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Immunities</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {character.immunities.map((i) => (
                            <Badge key={i} variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                              {i}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {character.vulnerabilities && character.vulnerabilities.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Vulnerabilities</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {character.vulnerabilities.map((v) => (
                            <Badge key={v} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

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
                <Shield className="w-4 h-4" />
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

            {/* Skills (Collapsible) */}
            {skills.length > 0 && abilities && (
              <>
                <Separator />
                <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span className="font-semibold">Skills</span>
                      <Badge variant="outline" className="text-xs">{skills.length}</Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${skillsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
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
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            {/* Proficiencies (Collapsible) */}
            {Object.keys(groupedProfs).length > 0 && (
              <>
                <Separator />
                <Collapsible open={profOpen} onOpenChange={setProfOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Sword className="w-4 h-4" />
                      <span className="font-semibold">Proficiencies</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${profOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-3">
                    {Object.entries(groupedProfs).map(([type, items]) => (
                      <div key={type}>
                        <span className="text-xs text-muted-foreground capitalize">{type}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {items.map((name) => (
                            <Badge key={name} variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4" />
                    <span className="font-semibold">Languages</span>
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

            {/* Spellbook */}
            {spells.length > 0 && (
              <>
                <Separator />
                <Collapsible open={spellsOpen} onOpenChange={setSpellsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-semibold">Spellbook</span>
                      <Badge variant="outline" className="text-xs">{spells.length}</Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${spellsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-4">
                    {/* Cantrips */}
                    {spells.filter(s => s.spell.level === 0).length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Cantrips</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {spells.filter(s => s.spell.level === 0).map((s) => (
                            <Badge 
                              key={s.id} 
                              variant="outline" 
                              className="cursor-pointer hover:bg-primary/10 text-xs"
                              onClick={() => setSelectedSpell(s.spell)}
                            >
                              {s.spell.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Level 1-9 Spells */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
                      const levelSpells = spells.filter(s => s.spell.level === level);
                      if (levelSpells.length === 0) return null;
                      return (
                        <div key={level}>
                          <span className="text-xs text-muted-foreground font-medium">Level {level}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {levelSpells.map((s) => (
                              <Badge 
                                key={s.id} 
                                variant={s.prepared ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/10 text-xs"
                                onClick={() => setSelectedSpell(s.spell)}
                              >
                                {s.spell.name}
                                {s.spell.concentration && <span className="ml-1 opacity-70">C</span>}
                                {s.spell.ritual && <span className="ml-1 opacity-70">R</span>}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            {/* Features & Abilities */}
            {(features.length > 0 || ancestryTraits.length > 0 || subancestryTraits.length > 0) && (
              <>
                <Separator />
                <Collapsible open={featuresOpen} onOpenChange={setFeaturesOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      <span className="font-semibold">Features & Abilities</span>
                      <Badge variant="outline" className="text-xs">
                        {features.length + ancestryTraits.length + subancestryTraits.length}
                      </Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-4">
                    {/* Class Features */}
                    {features.filter(f => f.source === 'Class').length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Class Features</span>
                        <div className="space-y-1 mt-1">
                          {features.filter(f => f.source === 'Class').map((feature) => (
                            <div 
                              key={feature.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedFeature(feature)}
                            >
                              <span className="text-sm font-medium">{feature.name}</span>
                              <Badge variant="outline" className={`text-[10px] ${getSourceBadgeColor('Class')}`}>
                                Lvl {feature.level}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Subclass Features */}
                    {features.filter(f => f.source === 'Subclass').length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Subclass Features</span>
                        <div className="space-y-1 mt-1">
                          {features.filter(f => f.source === 'Subclass').map((feature) => (
                            <div 
                              key={feature.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedFeature(feature)}
                            >
                              <span className="text-sm font-medium">{feature.name}</span>
                              <Badge variant="outline" className={`text-[10px] ${getSourceBadgeColor('Subclass')}`}>
                                Lvl {feature.level}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Ancestry Traits */}
                    {ancestryTraits.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Ancestry Traits</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ancestryTraits.map((trait, idx) => (
                            <Badge 
                              key={idx} 
                              variant="outline" 
                              className={`text-xs ${getSourceBadgeColor('Ancestry')}`}
                            >
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Subancestry Traits */}
                    {subancestryTraits.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Subancestry Traits</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {subancestryTraits.map((trait, idx) => (
                            <Badge 
                              key={idx} 
                              variant="outline" 
                              className={`text-xs ${getSourceBadgeColor('Subancestry')}`}
                            >
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            {/* Resources (from character_resources table) */}
            {resources.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4" />
                    <span className="font-semibold">Resources</span>
                  </div>
                  <div className="space-y-2">
                    {resources.map((resource) => (
                      <div key={resource.id} className="flex justify-between items-center text-sm">
                        <div className="flex flex-col">
                          <span className="text-foreground">{resource.label}</span>
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {resource.recharge === 'short' ? 'Short Rest' : 'Long Rest'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {Array.from({ length: resource.max_value }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full border-2 ${
                                  i < resource.current_value
                                    ? 'bg-primary border-primary'
                                    : 'bg-muted border-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {resource.current_value}/{resource.max_value}
                          </Badge>
                        </div>
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

    {/* Spell Detail Dialog */}
    <Dialog open={!!selectedSpell} onOpenChange={() => setSelectedSpell(null)}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        {selectedSpell && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {selectedSpell.name}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">
                  {selectedSpell.level === 0 ? 'Cantrip' : `Level ${selectedSpell.level}`}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {selectedSpell.school}
                </Badge>
                {selectedSpell.concentration && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                    Concentration
                  </Badge>
                )}
                {selectedSpell.ritual && (
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                    Ritual
                  </Badge>
                )}
              </div>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Casting Time</span>
                  <p className="font-medium">{selectedSpell.casting_time}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Range</span>
                  <p className="font-medium">{selectedSpell.range}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Components</span>
                  <p className="font-medium">
                    {Array.isArray(selectedSpell.components) 
                      ? selectedSpell.components.join(', ') 
                      : selectedSpell.components}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration</span>
                  <p className="font-medium">{selectedSpell.duration}</p>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Description</span>
                <p className="mt-1 text-sm whitespace-pre-wrap">{selectedSpell.description}</p>
              </div>
              {selectedSpell.higher_levels && (
                <div>
                  <span className="text-sm text-muted-foreground">At Higher Levels</span>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedSpell.higher_levels}</p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* Feature Detail Dialog */}
    <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        {selectedFeature && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                {selectedFeature.name}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className={getSourceBadgeColor(selectedFeature.source)}>
                  {selectedFeature.source}
                </Badge>
                <Badge variant="outline">Level {selectedFeature.level}</Badge>
              </div>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm whitespace-pre-wrap">
                {selectedFeature.description || 'No description available.'}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
