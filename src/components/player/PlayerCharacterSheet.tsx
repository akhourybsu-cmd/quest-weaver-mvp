import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
import { DeathSavingThrows } from "./DeathSavingThrows";

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
  death_save_success: number | null;
  death_save_fail: number | null;
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
  const [skillsOpen, setSkillsOpen] = useState(true);
  const [saveProficiencies, setSaveProficiencies] = useState<Record<string, boolean>>({});
  const [profOpen, setProfOpen] = useState(false);
  const [spellsOpen, setSpellsOpen] = useState(true);
  const [featuresOpen, setFeaturesOpen] = useState(true);
  const [selectedSpell, setSelectedSpell] = useState<CharacterSpell['spell'] | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<CharacterFeature | null>(null);
  const [selectedTrait, setSelectedTrait] = useState<AncestryTrait | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

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
      fetchSaveProficiencies(),
    ]);
  };

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      await fetchAllData();
    };

    loadData();

    const channel = supabase
      .channel(`char-sheet:${characterId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` },
        () => { if (isActive) fetchCharacter(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'character_spell_slots', filter: `character_id=eq.${characterId}` },
        () => { if (isActive) fetchSpellSlots(); }
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [characterId]);

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

  const fetchSaveProficiencies = async () => {
    const { data } = await supabase
      .from("character_saves")
      .select("str, dex, con, int, wis, cha")
      .eq("character_id", characterId)
      .maybeSingle();
    if (data) setSaveProficiencies(data as Record<string, boolean>);
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
    return 'fantasy-badge';
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
    if (pct > 50) return 'fantasy-hp-fill';
    if (pct > 25) return 'fantasy-hp-fill-warn';
    return 'fantasy-hp-fill-crit';
  };

  const groupedProfs = groupProficiencies();
  const hasDefenses = (character.resistances?.length || 0) > 0 || 
                      (character.immunities?.length || 0) > 0 || 
                      (character.vulnerabilities?.length || 0) > 0;
  const hasSpellcasting = character.spell_ability && character.spell_save_dc;

  // === COLUMN CONTENT RENDERERS ===

  const renderLeftColumn = () => (
    <div className="space-y-5">
      {/* HP Section */}
      <div className="relative p-4 rounded-lg parchment-card border border-border">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-1.5 rounded-full bg-hp-red/15 border border-hp-red/25">
            <Heart className="w-4 h-4 text-hp-red" />
          </div>
          <span className="font-cinzel font-semibold tracking-wide text-sm">Hit Points</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2.5">
          <span className="text-4xl font-bold tabular-nums text-foreground">
            {character.current_hp}
          </span>
          <span className="text-xl text-muted-foreground">/ {character.max_hp}</span>
          {character.temp_hp > 0 && (
            <span className="ml-2 fantasy-badge">
              +{character.temp_hp} temp
            </span>
          )}
        </div>
        <div className="h-3.5 fantasy-hp-track-embedded rounded-full overflow-hidden">
          <div 
            className={`h-full ${getHPColor()} transition-all duration-500 rounded-full`}
            style={{ width: `${Math.min(100, getHPPercentage())}%` }}
          />
        </div>
      </div>

      {/* Death Saving Throws */}
      {character.current_hp <= 0 && (
        <DeathSavingThrows
          characterId={character.id}
          successes={character.death_save_success || 0}
          failures={character.death_save_fail || 0}
          onUpdate={fetchCharacter}
        />
      )}

      {/* Core Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { icon: Shield, label: 'Armor Class', shortLabel: 'AC', value: character.ac, color: 'text-brass' },
          { icon: Zap, label: 'Speed', shortLabel: 'Speed', value: `${character.speed} ft`, color: 'text-primary' },
          { icon: Star, label: 'Proficiency', shortLabel: 'Prof', value: `+${character.proficiency_bonus}`, color: 'text-brass' },
          { icon: BookOpen, label: 'Perception', shortLabel: 'Percep', value: character.passive_perception, color: 'text-muted-foreground' },
        ].map((stat) => (
          <div 
            key={stat.shortLabel}
            className="relative p-4 text-center rounded-lg bg-card border-2 border-brass/30 hover:border-brass/50 transition-colors parchment-inset"
          >
            <stat.icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.color}`} />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-cinzel mt-0.5">{stat.shortLabel}</div>
          </div>
        ))}
      </div>

      {/* Exhaustion & Warlock Pact Slots */}
      <div className="space-y-3">
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

      {/* Defenses */}
      {hasDefenses && (
        <div className="space-y-3">
          <div className="fantasy-section-header flex items-center gap-2 !border-b-0 !pb-0 !mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Defenses</span>
          </div>
          <div className="space-y-2">
            {character.resistances && character.resistances.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {character.resistances.map((r: string) => (
                  <span key={r} className="fantasy-badge text-[10px]">Resist: {r}</span>
                ))}
              </div>
            )}
            {character.immunities && character.immunities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {character.immunities.map((i: string) => (
                  <span key={i} className="fantasy-badge text-[10px]">Immune: {i}</span>
                ))}
              </div>
            )}
            {character.vulnerabilities && character.vulnerabilities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {character.vulnerabilities.map((v: string) => (
                  <span key={v} className="fantasy-badge text-[10px]">Vuln: {v}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <div className="space-y-3">
          <div className="fantasy-section-header flex items-center gap-2 !border-b-0 !pb-0 !mb-2">
            <Flame className="w-4 h-4" />
            <span>Resources</span>
          </div>
          <div className="space-y-2">
            {resources.map((res) => (
              <div key={res.id} className="p-3 rounded-lg parchment-card border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{res.label}</span>
                  <span className="fantasy-badge text-[10px]">{res.recharge}</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: res.max_value }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full border-2 transition-colors ${
                        i < res.current_value
                          ? 'bg-warning-amber border-warning-amber shadow-[0_0_4px_hsl(var(--warning-amber)/0.3)]'
                          : 'bg-card border-border'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level Up Button */}
      <button
        className="w-full py-2.5 px-4 rounded-lg fantasy-level-up-btn flex items-center justify-center gap-2"
        onClick={() => setShowLevelUp(true)}
      >
        <TrendingUp className="h-4 w-4" />
        Level Up
      </button>
    </div>
  );

  const renderMiddleColumn = () => (
    <div className="space-y-5">
      {/* Ability Scores */}
      {abilities && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
            <span className="font-cinzel text-xs text-brass tracking-[0.15em] uppercase font-bold">Abilities</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {Object.entries(abilities).map(([key, value]) => {
              const mod = getAbilityModifier(value);
              return (
                <div 
                  key={key} 
                  className="relative text-center p-4 rounded-lg bg-gradient-to-b from-brass/8 to-transparent border-2 border-brass/40 hover:border-brass transition-colors parchment-inset"
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brass mb-1.5 font-cinzel">{key}</div>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className={`text-sm font-semibold mt-0.5 ${mod >= 0 ? 'text-buff-green' : 'text-hp-red'}`}>
                    {formatModifier(mod)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Saving Throws */}
      <div className="space-y-3 mt-6">
        <div className="fantasy-section-header flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Saving Throws</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: 'STR', value: character.str_save, key: 'str' },
            { label: 'DEX', value: character.dex_save, key: 'dex' },
            { label: 'CON', value: character.con_save, key: 'con' },
            { label: 'INT', value: character.int_save, key: 'int' },
            { label: 'WIS', value: character.wis_save, key: 'wis' },
            { label: 'CHA', value: character.cha_save, key: 'cha' },
          ].map((save) => {
            const isProficient = saveProficiencies[save.key as keyof typeof saveProficiencies] || false;
            return (
              <div key={save.label} className="flex justify-between items-center px-3 py-2 rounded-lg bg-card/80 border border-border/50 parchment-inset">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isProficient ? 'bg-brass shadow-[0_0_4px_hsl(var(--brass)/0.5)]' : 'bg-muted-foreground/30'}`} />
                  <span className="text-muted-foreground font-medium">{save.label}</span>
                </div>
                <span className={`font-mono font-bold ${(save.value || 0) >= 0 ? 'text-foreground' : 'text-hp-red'}`}>
                  {(save.value || 0) >= 0 ? '+' : ''}{save.value || 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && abilities && (
        <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg parchment-card border border-border hover:border-brass/40 transition-colors">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brass" />
              <span className="font-cinzel text-sm tracking-wide">Skills</span>
              <span className="fantasy-badge text-[10px]">{skills.length}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${skillsOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-1 gap-1.5 text-sm">
              {skills.map((skill) => {
                const abilityKey = getSkillAbility(skill.skill);
                const abilityScore = abilities[abilityKey];
                const modifier = getSkillModifier(skill, abilityScore);
                return (
                  <div key={skill.skill} className="flex justify-between items-center px-2.5 py-1.5 rounded bg-muted/20 hover:bg-muted/40 transition-colors">
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      {skill.skill}
                      {skill.expertise && <span className="fantasy-badge text-[8px] !py-0">E</span>}
                      {skill.proficient && !skill.expertise && <span className="text-brass text-xs">●</span>}
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

      {/* Proficiencies */}
      {Object.keys(groupedProfs).length > 0 && (
        <Collapsible open={profOpen} onOpenChange={setProfOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg parchment-card border border-border hover:border-brass/40 transition-colors">
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-brass" />
              <span className="font-cinzel text-sm tracking-wide">Proficiencies</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${profOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            {Object.entries(groupedProfs).map(([type, items]) => (
              <div key={type}>
                <span className="fantasy-subsection-label">{type}</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {items.map((name) => (
                    <span key={name} className="fantasy-badge text-[10px]">{name}</span>
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
          <div className="fantasy-section-header flex items-center gap-2 !border-b-0 !pb-0 !mb-2">
            <Languages className="w-4 h-4" />
            <span>Languages</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((lang) => (
              <span key={lang.name} className="fantasy-badge">{lang.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRightColumn = () => (
    <div className="space-y-5">
      {/* Spellcasting Stats */}
      {hasSpellcasting && (
        <div className="space-y-3">
          <div className="fantasy-section-header flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            <span>Spellcasting</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Ability', value: character.spell_ability?.toUpperCase() },
              { label: 'Save DC', value: character.spell_save_dc },
              { label: 'Attack', value: character.spell_attack_mod && character.spell_attack_mod >= 0 ? `+${character.spell_attack_mod}` : character.spell_attack_mod },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 rounded-lg border-2 border-brass/30 parchment-inset bg-gradient-to-b from-brass/5 to-transparent">
                <div className="text-[10px] uppercase text-muted-foreground font-cinzel tracking-wider">{stat.label}</div>
                <div className="text-lg font-bold text-brass mt-0.5">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spell Slots */}
      {spellSlots.length > 0 && (
        <div className="space-y-3">
          <div className="fantasy-section-header flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Spell Slots</span>
          </div>
          <div className="space-y-2">
            {spellSlots.map((slot) => (
              <div key={slot.spell_level} className="flex items-center justify-between p-2.5 rounded-lg parchment-card border border-border">
                <span className="text-sm text-muted-foreground font-medium">Level {slot.spell_level}</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: slot.max_slots }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 ${
                        i < slot.max_slots - slot.used_slots
                          ? 'bg-brass border-brass shadow-[0_0_3px_hsl(var(--brass)/0.3)]'
                          : 'bg-card border-border'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spellbook */}
      {spells.length > 0 && (
        <Collapsible open={spellsOpen} onOpenChange={setSpellsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg parchment-card border border-border hover:border-brass/40 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brass" />
              <span className="font-cinzel text-sm tracking-wide">Spellbook</span>
              <span className="fantasy-badge text-[10px]">{spells.length}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${spellsOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            {spells.filter(s => s.spell.level === 0).length > 0 && (
              <div>
                <span className="fantasy-subsection-label">Cantrips</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {spells.filter(s => s.spell.level === 0).map((s) => (
                    <span 
                      key={s.id} 
                      className="fantasy-badge cursor-pointer hover:border-brass/80 transition-colors"
                      onClick={() => setSelectedSpell(s.spell)}
                    >
                      {s.spell.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
              const levelSpells = spells.filter(s => s.spell.level === level);
              if (levelSpells.length === 0) return null;
              return (
                <div key={level}>
                  <span className="fantasy-subsection-label">Level {level}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {levelSpells.map((s) => (
                      <span 
                        key={s.id} 
                        className={`fantasy-badge cursor-pointer hover:border-brass/80 transition-colors ${s.prepared ? '!bg-brass/20 !border-brass/50' : ''}`}
                        onClick={() => setSelectedSpell(s.spell)}
                      >
                        {s.spell.name}
                        {s.spell.concentration && <span className="ml-1 opacity-60">C</span>}
                        {s.spell.ritual && <span className="ml-1 opacity-60">R</span>}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Features & Abilities */}
      {(features.length > 0 || ancestryTraits.length > 0 || subancestryTraits.length > 0) && (
        <Collapsible open={featuresOpen} onOpenChange={setFeaturesOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg parchment-card border border-border hover:border-brass/40 transition-colors">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-brass" />
              <span className="font-cinzel text-sm tracking-wide">Features & Abilities</span>
              <span className="fantasy-badge text-[10px]">
                {features.length + ancestryTraits.length + subancestryTraits.length}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-brass transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            {features.filter(f => f.source === 'Class').length > 0 && (
              <div>
                <span className="fantasy-subsection-label">Class Features</span>
                <div className="space-y-1.5 mt-2">
                  {features.filter(f => f.source === 'Class').map((feature) => (
                    <div 
                      key={feature.id}
                      className="fantasy-feature-row flex items-center justify-between p-2 rounded-r-lg cursor-pointer hover:bg-brass/5 transition-colors"
                      onClick={() => setSelectedFeature(feature)}
                    >
                      <span className="text-sm font-medium">{feature.name}</span>
                      <span className={`text-[10px] ${getSourceBadgeColor('Class')}`}>
                        Lvl {feature.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {features.filter(f => f.source === 'Subclass').length > 0 && (
              <div>
                <span className="fantasy-subsection-label">Subclass Features</span>
                <div className="space-y-1.5 mt-2">
                  {features.filter(f => f.source === 'Subclass').map((feature) => (
                    <div 
                      key={feature.id}
                      className="fantasy-feature-row flex items-center justify-between p-2 rounded-r-lg cursor-pointer hover:bg-brass/5 transition-colors"
                      onClick={() => setSelectedFeature(feature)}
                    >
                      <span className="text-sm font-medium">{feature.name}</span>
                      <span className={`text-[10px] ${getSourceBadgeColor('Subclass')}`}>
                        Lvl {feature.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ancestryTraits.length > 0 && (
              <div>
                <span className="fantasy-subsection-label">Ancestry Traits</span>
                <div className="space-y-1.5 mt-2">
                  {ancestryTraits.map((trait, idx) => (
                    <div 
                      key={idx}
                      className="fantasy-feature-row flex items-center justify-between p-2 rounded-r-lg cursor-pointer hover:bg-brass/5 transition-colors"
                      onClick={() => setSelectedTrait(trait)}
                    >
                      <span className="text-sm font-medium">{trait.name}</span>
                      <span className="fantasy-badge text-[10px]">Ancestry</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {subancestryTraits.length > 0 && (
              <div>
                <span className="fantasy-subsection-label">Subancestry Traits</span>
                <div className="space-y-1.5 mt-2">
                  {subancestryTraits.map((trait, idx) => (
                    <div 
                      key={idx}
                      className="fantasy-feature-row flex items-center justify-between p-2 rounded-r-lg cursor-pointer hover:bg-brass/5 transition-colors"
                      onClick={() => setSelectedTrait(trait)}
                    >
                      <span className="text-sm font-medium">{trait.name}</span>
                      <span className="fantasy-badge text-[10px]">Subancestry</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );

  return (
    <>
      {/* 3-Column Desktop / Single-Column Mobile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1">
          <ScrollArea className="lg:h-[calc(100vh-18rem)]">
            <div className="pr-2">
              {renderLeftColumn()}
            </div>
          </ScrollArea>
        </div>

        {/* Middle Column */}
        <div className="lg:col-span-1">
          <ScrollArea className="lg:h-[calc(100vh-18rem)]">
            <div className="pr-2">
              {renderMiddleColumn()}
            </div>
          </ScrollArea>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
          <ScrollArea className="lg:h-[calc(100vh-18rem)]">
            <div className="pr-2">
              {renderRightColumn()}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Spell Detail Dialog */}
      <Dialog open={!!selectedSpell} onOpenChange={() => setSelectedSpell(null)}>
        <DialogContent variant="ornaments" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brass" />
              {selectedSpell?.name}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap gap-2 mt-2">
              <span className="fantasy-badge">{selectedSpell?.level === 0 ? 'Cantrip' : `Level ${selectedSpell?.level}`}</span>
              <span className="fantasy-badge">{selectedSpell?.school}</span>
              {selectedSpell?.concentration && <span className="fantasy-badge">Concentration</span>}
              {selectedSpell?.ritual && <span className="fantasy-badge">Ritual</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div><strong>Casting Time:</strong> {selectedSpell?.casting_time}</div>
              <div><strong>Range:</strong> {selectedSpell?.range}</div>
              <div><strong>Components:</strong> {
                Array.isArray(selectedSpell?.components)
                  ? selectedSpell.components.join(', ')
                  : typeof selectedSpell?.components === 'object' && selectedSpell?.components
                    ? [
                        (selectedSpell.components as any).verbal && 'V',
                        (selectedSpell.components as any).somatic && 'S',
                        (selectedSpell.components as any).material && 'M',
                      ].filter(Boolean).join(', ')
                    : ''
              }</div>
              <div><strong>Duration:</strong> {selectedSpell?.duration}</div>
            </div>
            <div className="p-3 rounded-lg parchment-card border border-border">
              {selectedSpell?.description}
            </div>
            {selectedSpell?.higher_levels && (
              <div className="p-3 rounded-lg parchment-card border border-brass/30">
                <strong className="text-brass">At Higher Levels:</strong> {selectedSpell.higher_levels}
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
              <span className={getSourceBadgeColor(selectedFeature?.source || '')}>
                {selectedFeature?.source}
              </span>
              <span className="fantasy-badge">Level {selectedFeature?.level}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg parchment-card border border-border text-sm">
            {selectedFeature?.description || 'No description available.'}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ancestry Trait Detail Dialog */}
      <Dialog open={!!selectedTrait} onOpenChange={() => setSelectedTrait(null)}>
        <DialogContent variant="ornaments" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Star className="w-5 h-5 text-brass" />
              {selectedTrait?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-3 rounded-lg parchment-card border border-border text-sm">
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
