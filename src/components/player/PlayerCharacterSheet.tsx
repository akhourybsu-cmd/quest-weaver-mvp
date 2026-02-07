import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Heart, Shield, Zap, BookOpen, Languages, 
  ShieldAlert, Wand2, ChevronDown, Sword, Sparkles, Star, Flame, TrendingUp
} from "lucide-react";
import { LevelUpWizard } from "@/components/character/LevelUpWizard";
import { ExhaustionManager } from "@/components/combat/ExhaustionManager";
import { WarlockPactSlots } from "@/components/spells/WarlockPactSlots";

// Type definitions
interface AncestryTrait {
  name: string;
  description: string;
}

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
  subclass_id: string | null;
  portrait_url: string | null;
  exhaustion_level: number;
  pact_slots_max: number | null;
  pact_slots_used: number | null;
  pact_slot_level: number | null;
  subclass_name?: string | null;
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
  const [ancestryTraits, setAncestryTraits] = useState<AncestryTrait[]>([]);
  const [subancestryTraits, setSubancestryTraits] = useState<AncestryTrait[]>([]);
  const [ancestryName, setAncestryName] = useState<string>('');
  const [subancestryName, setSubancestryName] = useState<string>('');
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [profOpen, setProfOpen] = useState(false);
  const [spellsOpen, setSpellsOpen] = useState(true);
  const [featuresOpen, setFeaturesOpen] = useState(true);
  const [selectedSpell, setSelectedSpell] = useState<CharacterSpell['spell'] | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<CharacterFeature | null>(null);
  const [selectedTrait, setSelectedTrait] = useState<AncestryTrait | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel(`char-sheet:${characterId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` },
        () => fetchCharacter()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'character_spell_slots', filter: `character_id=eq.${characterId}` },
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
      .select("*, srd_ancestries(name, traits), srd_subancestries(name, traits), srd_subclasses(name)")
      .eq("id", characterId)
      .single();

    if (data) {
      const joined = data as typeof data & {
        srd_subclasses: { name: string } | null;
        srd_ancestries: { name: string; traits: AncestryTrait[] } | null;
        srd_subancestries: { name: string; traits: AncestryTrait[] } | null;
      };
      setCharacter({
        ...data,
        subclass_name: joined.srd_subclasses?.name || null
      } as CharacterData);
      // Extract ancestry traits (they come as [{name, description}])
      if (joined.srd_ancestries?.traits) {
        setAncestryTraits(joined.srd_ancestries.traits);
        setAncestryName(joined.srd_ancestries.name || '');
      }
      if (joined.srd_subancestries?.traits) {
        setSubancestryTraits(joined.srd_subancestries.traits);
        setSubancestryName(joined.srd_subancestries.name || '');
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
        id, prepared, known,
        spell:srd_spells(id, name, level, school, casting_time, range, components, duration, concentration, ritual, description, higher_levels)
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

  const getAbilityModifier = (score: number) => Math.floor((score - 10) / 2);
  const formatModifier = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

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

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'Class': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Subclass': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Ancestry': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Subancestry': return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'Background': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Feat': return 'bg-red-500/20 text-red-300 border-red-500/40';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!character) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brass border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-cinzel">Loading character...</p>
        </div>
      </div>
    );
  }

  const getHPPercentage = () => (character.current_hp / character.max_hp) * 100;
  const getHPColor = () => {
    const pct = getHPPercentage();
    if (pct > 50) return 'bg-buff-green';
    if (pct > 25) return 'bg-warning-amber';
    return 'bg-hp-red';
  };

  const groupedProfs = groupProficiencies();
  const hasDefenses = (character.resistances?.length || 0) > 0 || 
                      (character.immunities?.length || 0) > 0 || 
                      (character.vulnerabilities?.length || 0) > 0;
  const hasSpellcasting = character.spell_ability && character.spell_save_dc;

  return (
    <>
      <Card className="fantasy-border-ornaments relative overflow-hidden">
        {/* Parchment texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-parchment/5 via-transparent to-brass/5 pointer-events-none" />
        
        {/* Character Header */}
        <div className="relative p-6 pb-4 border-b-2 border-brass/30 bg-gradient-to-r from-brass/10 via-transparent to-brass/10">
          <div className="flex items-start gap-4">
            {/* Portrait Frame */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-lg border-2 border-brass bg-muted/50 overflow-hidden shadow-lg">
                {character.portrait_url ? (
                  <img src={character.portrait_url} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-cinzel text-brass">
                    {character.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Decorative corner */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-brass" />
            </div>
            
            {/* Name & Class */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-cinzel font-bold text-foreground tracking-wide truncate">
                  {character.name}
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 border-brass/50 hover:border-brass hover:bg-brass/10"
                  onClick={() => setShowLevelUp(true)}
                >
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  Level Up
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Level {character.level} {character.class}
              </p>
              {ancestryName && (
                <p className="text-xs text-brass mt-0.5">
                  {subancestryName ? `${subancestryName} ` : ''}{ancestryName}
                </p>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)]">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              
              {/* HP Section - Dramatic */}
              <div className="relative p-4 rounded-lg bg-gradient-to-br from-hp-red/10 to-transparent border border-hp-red/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-full bg-hp-red/20 border border-hp-red/30">
                    <Heart className="w-5 h-5 text-hp-red" />
                  </div>
                  <span className="font-cinzel font-semibold tracking-wide">Hit Points</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold tabular-nums text-foreground">
                    {character.current_hp}
                  </span>
                  <span className="text-xl text-muted-foreground">/ {character.max_hp}</span>
                  {character.temp_hp > 0 && (
                    <Badge className="ml-2 bg-secondary/20 text-secondary border-secondary/30">
                      +{character.temp_hp} temp
                    </Badge>
                  )}
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                  <div 
                    className={`h-full ${getHPColor()} transition-all duration-500`}
                    style={{ width: `${Math.min(100, getHPPercentage())}%` }}
                  />
                </div>
              </div>

              {/* Exhaustion & Warlock Pact Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ExhaustionManager
                  characterId={character.id}
                  characterName={character.name}
                  currentLevel={character.exhaustion_level || 0}
                  baseSpeed={character.speed || 30}
                  baseMaxHP={character.max_hp}
                  onLevelChange={fetchCharacter}
                  compact
                />
                {character.class?.toLowerCase().includes('warlock') && (
                  <WarlockPactSlots
                    characterId={character.id}
                    characterName={character.name}
                    pactSlotsMax={character.pact_slots_max || 1}
                    pactSlotsUsed={character.pact_slots_used || 0}
                    pactSlotLevel={character.pact_slot_level || 1}
                    compact
                  />
                )}
              </div>

              {/* Core Stats Grid - Responsive */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { icon: Shield, label: 'AC', value: character.ac, color: 'text-brass' },
                  { icon: Zap, label: 'Speed', value: `${character.speed}`, color: 'text-primary' },
                  { icon: Star, label: 'Prof', value: `+${character.proficiency_bonus}`, color: 'text-secondary' },
                  { icon: BookOpen, label: 'Percep', value: character.passive_perception, color: 'text-muted-foreground' },
                ].map((stat) => (
                  <div 
                    key={stat.label}
                    className="relative p-3 text-center rounded-lg bg-card border-2 border-brass/30 hover:border-brass/50 transition-colors"
                  >
                    <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                    <div className="text-xl font-bold">{stat.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Ability Scores - Fantasy Hexagons */}
              {abilities && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
                    <span className="font-cinzel text-sm text-brass tracking-widest uppercase">Abilities</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Object.entries(abilities).map(([key, value]) => {
                      const mod = getAbilityModifier(value);
                      return (
                        <div 
                          key={key} 
                          className="relative text-center p-3 rounded-lg bg-gradient-to-b from-brass/10 to-transparent border-2 border-brass/40 hover:border-brass transition-colors"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider text-brass mb-1">{key}</div>
                          <div className="text-2xl font-bold">{value}</div>
                          <div className={`text-sm font-semibold ${mod >= 0 ? 'text-buff-green' : 'text-hp-red'}`}>
                            {formatModifier(mod)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saving Throws */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brass" />
                  <span className="font-cinzel text-sm text-brass tracking-wide">Saving Throws</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: 'STR', value: character.str_save },
                    { label: 'DEX', value: character.dex_save },
                    { label: 'CON', value: character.con_save },
                    { label: 'INT', value: character.int_save },
                    { label: 'WIS', value: character.wis_save },
                    { label: 'CHA', value: character.cha_save },
                  ].map((save) => (
                    <div key={save.label} className="flex justify-between items-center px-3 py-1.5 rounded bg-muted/30 border border-border/50">
                      <span className="text-muted-foreground font-medium">{save.label}</span>
                      <span className={`font-mono font-bold ${(save.value || 0) >= 0 ? 'text-foreground' : 'text-hp-red'}`}>
                        {(save.value || 0) >= 0 ? '+' : ''}{save.value || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spellcasting Stats */}
              {hasSpellcasting && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-primary" />
                    <span className="font-cinzel text-sm text-primary tracking-wide">Spellcasting</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Ability', value: character.spell_ability?.toUpperCase() },
                      { label: 'Save DC', value: character.spell_save_dc },
                      { label: 'Attack', value: character.spell_attack_mod && character.spell_attack_mod >= 0 ? `+${character.spell_attack_mod}` : character.spell_attack_mod },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                        <div className="text-[10px] uppercase text-muted-foreground">{stat.label}</div>
                        <div className="text-lg font-bold text-primary">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Defenses */}
              {hasDefenses && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-brass" />
                    <span className="font-cinzel text-sm text-brass tracking-wide">Defenses</span>
                  </div>
                  <div className="space-y-2">
                    {character.resistances && character.resistances.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {character.resistances.map((r) => (
                          <Badge key={r} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                            Resist: {r}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {character.immunities && character.immunities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {character.immunities.map((i) => (
                          <Badge key={i} variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                            Immune: {i}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {character.vulnerabilities && character.vulnerabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {character.vulnerabilities.map((v) => (
                          <Badge key={v} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                            Vuln: {v}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resources */}
              {resources.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-warning-amber" />
                    <span className="font-cinzel text-sm text-warning-amber tracking-wide">Resources</span>
                  </div>
                  <div className="space-y-2">
                    {resources.map((res) => (
                      <div key={res.id} className="p-3 rounded-lg bg-warning-amber/5 border border-warning-amber/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">{res.label}</span>
                          <Badge variant="outline" className="text-[10px] bg-muted/30">
                            {res.recharge}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: res.max_value }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-full border-2 transition-colors ${
                                i < res.current_value
                                  ? 'bg-warning-amber border-warning-amber shadow-[0_0_6px_hsl(var(--warning-amber)/0.5)]'
                                  : 'bg-muted/30 border-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills (Collapsible) */}
              {skills.length > 0 && abilities && (
                <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-brass" />
                      <span className="font-cinzel text-sm tracking-wide">Skills</span>
                      <Badge variant="outline" className="text-xs">{skills.length}</Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${skillsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {skills.map((skill) => {
                        const abilityKey = getSkillAbility(skill.skill);
                        const abilityScore = abilities[abilityKey];
                        const modifier = getSkillModifier(skill, abilityScore);
                        return (
                          <div key={skill.skill} className="flex justify-between items-center px-2 py-1 rounded bg-muted/20">
                            <span className="text-muted-foreground flex items-center gap-1 text-xs">
                              {skill.skill}
                              {skill.expertise && <Badge variant="outline" className="text-[8px] h-3 px-1 bg-primary/20">E</Badge>}
                              {skill.proficient && !skill.expertise && <span className="text-primary text-xs">●</span>}
                            </span>
                            <span className={`font-mono font-bold ${modifier >= 0 ? 'text-foreground' : 'text-hp-red'}`}>
                              {formatModifier(modifier)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Proficiencies (Collapsible) */}
              {Object.keys(groupedProfs).length > 0 && (
                <Collapsible open={profOpen} onOpenChange={setProfOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Sword className="w-4 h-4 text-brass" />
                      <span className="font-cinzel text-sm tracking-wide">Proficiencies</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${profOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    {Object.entries(groupedProfs).map(([type, items]) => (
                      <div key={type}>
                        <span className="text-xs text-muted-foreground capitalize font-medium">{type}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {items.map((name) => (
                            <Badge key={name} variant="secondary" className="text-xs bg-secondary/10 border-secondary/30">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Languages */}
              {languages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-brass" />
                    <span className="font-cinzel text-sm tracking-wide">Languages</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {languages.map((lang) => (
                      <Badge key={lang.name} variant="outline" className="text-xs">
                        {lang.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Spell Slots */}
              {spellSlots.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-cinzel text-sm text-primary tracking-wide">Spell Slots</span>
                  </div>
                  <div className="space-y-2">
                    {spellSlots.map((slot) => (
                      <div key={slot.spell_level} className="flex items-center justify-between p-2 rounded bg-primary/5 border border-primary/20">
                        <span className="text-sm text-muted-foreground">Level {slot.spell_level}</span>
                        <div className="flex gap-1">
                          {Array.from({ length: slot.max_slots }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-4 h-4 rounded-full border-2 ${
                                i < slot.max_slots - slot.used_slots
                                  ? 'bg-primary border-primary shadow-[0_0_4px_hsl(var(--primary)/0.5)]'
                                  : 'bg-muted/30 border-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spellbook (Collapsible) */}
              {spells.length > 0 && (
                <Collapsible open={spellsOpen} onOpenChange={setSpellsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-cinzel text-sm text-primary tracking-wide">Spellbook</span>
                      <Badge variant="outline" className="text-xs border-primary/30">{spells.length}</Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-primary transition-transform ${spellsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    {/* Cantrips */}
                    {spells.filter(s => s.spell.level === 0).length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Cantrips</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {spells.filter(s => s.spell.level === 0).map((s) => (
                            <Badge 
                              key={s.id} 
                              variant="outline" 
                              className="cursor-pointer hover:bg-primary/10 text-xs border-primary/30"
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
                                className="cursor-pointer hover:bg-primary/20 text-xs"
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
              )}

              {/* Features & Abilities (Collapsible) */}
              {(features.length > 0 || ancestryTraits.length > 0 || subancestryTraits.length > 0) && (
                <Collapsible open={featuresOpen} onOpenChange={setFeaturesOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-brass/5 border border-brass/20 hover:bg-brass/10 transition-colors">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-brass" />
                      <span className="font-cinzel text-sm text-brass tracking-wide">Features & Abilities</span>
                      <Badge variant="outline" className="text-xs border-brass/30">
                        {features.length + ancestryTraits.length + subancestryTraits.length}
                      </Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-brass transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
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
                              className="flex items-center justify-between p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 cursor-pointer hover:bg-blue-500/10 transition-colors"
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
                              className="flex items-center justify-between p-2 rounded-lg bg-purple-500/5 border border-purple-500/20 cursor-pointer hover:bg-purple-500/10 transition-colors"
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
                    {/* Ancestry Traits - FIXED: Now uses trait.name */}
                    {ancestryTraits.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Ancestry Traits</span>
                        <div className="space-y-1 mt-1">
                          {ancestryTraits.map((trait, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                              onClick={() => setSelectedTrait(trait)}
                            >
                              <span className="text-sm font-medium">{trait.name}</span>
                              <Badge variant="outline" className={`text-[10px] ${getSourceBadgeColor('Ancestry')}`}>
                                Ancestry
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Subancestry Traits - FIXED: Now uses trait.name */}
                    {subancestryTraits.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">Subancestry Traits</span>
                        <div className="space-y-1 mt-1">
                          {subancestryTraits.map((trait, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-lg bg-teal-500/5 border border-teal-500/20 cursor-pointer hover:bg-teal-500/10 transition-colors"
                              onClick={() => setSelectedTrait(trait)}
                            >
                              <span className="text-sm font-medium">{trait.name}</span>
                              <Badge variant="outline" className={`text-[10px] ${getSourceBadgeColor('Subancestry')}`}>
                                Subancestry
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Spell Detail Dialog */}
      <Dialog open={!!selectedSpell} onOpenChange={() => setSelectedSpell(null)}>
        <DialogContent variant="ornaments" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {selectedSpell?.name}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{selectedSpell?.level === 0 ? 'Cantrip' : `Level ${selectedSpell?.level}`}</Badge>
              <Badge variant="outline">{selectedSpell?.school}</Badge>
              {selectedSpell?.concentration && <Badge variant="outline" className="bg-primary/10">Concentration</Badge>}
              {selectedSpell?.ritual && <Badge variant="outline" className="bg-secondary/10">Ritual</Badge>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div><strong>Casting Time:</strong> {selectedSpell?.casting_time}</div>
              <div><strong>Range:</strong> {selectedSpell?.range}</div>
              <div><strong>Components:</strong> {selectedSpell?.components?.join(', ')}</div>
              <div><strong>Duration:</strong> {selectedSpell?.duration}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              {selectedSpell?.description}
            </div>
            {selectedSpell?.higher_levels && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <strong className="text-primary">At Higher Levels:</strong> {selectedSpell.higher_levels}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Detail Dialog */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent variant="ornaments" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Star className="w-5 h-5 text-brass" />
              {selectedFeature?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getSourceBadgeColor(selectedFeature?.source || '')}>
                {selectedFeature?.source}
              </Badge>
              <Badge variant="outline">Level {selectedFeature?.level}</Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
            {selectedFeature?.description || 'No description available.'}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ancestry Trait Detail Dialog */}
      <Dialog open={!!selectedTrait} onOpenChange={() => setSelectedTrait(null)}>
        <DialogContent variant="ornaments" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-400" />
              {selectedTrait?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
            {selectedTrait?.description || 'No description available.'}
          </div>
        </DialogContent>
      </Dialog>

      {/* Level Up Wizard */}
      <LevelUpWizard
        open={showLevelUp}
        onOpenChange={setShowLevelUp}
        characterId={characterId}
        currentLevel={character.level}
        onComplete={() => {
          setShowLevelUp(false);
          fetchAllData();
        }}
      />
    </>
  );
}
