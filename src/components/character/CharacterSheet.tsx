import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Heart, Shield, Zap, User, Sword, Sparkles, BookOpen, StickyNote, Wand2, BookMarked } from "lucide-react";
import { calculateModifier, calculateProficiencyBonus } from "@/lib/dnd5e";
import { calculateSkillModifier } from "@/lib/characterRules";
import { SpellPreparationManager } from "@/components/spells/SpellPreparationManager";
import { CustomSpellCreator } from "@/components/spells/CustomSpellCreator";
import { SpellSlotTracker } from "@/components/spells/SpellSlotTracker";
import { SpellbookManager } from "@/components/spells/SpellbookManager";
import { ResourcePanel } from "@/components/character/ResourcePanel";
import { DefensesPanel } from "@/components/character/DefensesPanel";
import { DefensesEditor } from "@/components/character/DefensesEditor";
import type { DamageType } from "@/lib/damageEngine";

interface CharacterSheetProps {
  characterId: string;
  campaignId: string;
}

const CharacterSheet = ({ characterId, campaignId }: CharacterSheetProps) => {
  const { toast } = useToast();
  const [character, setCharacter] = useState<any>(null);
  const [abilities, setAbilities] = useState<any>(null);
  const [saves, setSaves] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [proficiencies, setProficiencies] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [attacks, setAttacks] = useState<any[]>([]);
  const [spells, setSpells] = useState<any[]>([]);
  const [feats, setFeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSpellPreparation, setShowSpellPreparation] = useState(false);
  const [showCustomSpell, setShowCustomSpell] = useState(false);
  const [showSpellbook, setShowSpellbook] = useState(false);
  const [showDefensesEditor, setShowDefensesEditor] = useState(false);

  useEffect(() => {
    loadCharacter();
  }, [characterId]);

  const loadCharacter = async () => {
    setLoading(true);
    try {
      // Load main character data
      const { data: charData, error: charError } = await supabase
        .from("characters")
        .select("*")
        .eq("id", characterId)
        .single();

      if (charError) throw charError;
      setCharacter(charData);

      // Load abilities
      const { data: abilitiesData } = await supabase
        .from("character_abilities")
        .select("*")
        .eq("character_id", characterId)
        .single();
      setAbilities(abilitiesData);

      // Load saves
      const { data: savesData } = await supabase
        .from("character_saves")
        .select("*")
        .eq("character_id", characterId)
        .single();
      setSaves(savesData);

      // Load skills
      const { data: skillsData } = await supabase
        .from("character_skills")
        .select("*")
        .eq("character_id", characterId);
      setSkills(skillsData || []);

      // Load proficiencies
      const { data: profsData } = await supabase
        .from("character_proficiencies")
        .select("*")
        .eq("character_id", characterId);
      setProficiencies(profsData || []);

      // Load languages
      const { data: langsData } = await supabase
        .from("character_languages")
        .select("*")
        .eq("character_id", characterId);
      setLanguages(langsData || []);

      // Load features
      const { data: featuresData } = await supabase
        .from("character_features")
        .select("*")
        .eq("character_id", characterId)
        .order("level");
      setFeatures(featuresData || []);

      // Load equipment
      const { data: equipData } = await supabase
        .from("character_equipment")
        .select("*")
        .eq("character_id", characterId);
      setEquipment(equipData || []);

      // Load attacks
      const { data: attacksData } = await supabase
        .from("character_attacks")
        .select("*")
        .eq("character_id", characterId);
      setAttacks(attacksData || []);

      // Load spells if caster
      const { data: spellsData } = await supabase
        .from("character_spells")
        .select("*, spell:srd_spells(*)")
        .eq("character_id", characterId);
      setSpells(spellsData || []);

      // Load feats
      const { data: featsData } = await supabase
        .from("character_feats")
        .select("*, feat:srd_feats(*)")
        .eq("character_id", characterId)
        .order("level_gained");
      setFeats(featsData || []);

    } catch (error) {
      console.error("Error loading character:", error);
      toast({
        title: "Error loading character",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !character || !abilities) {
    return <div className="flex items-center justify-center p-8">Loading character...</div>;
  }

  const profBonus = calculateProficiencyBonus(character.level);
  const hpPercent = (character.current_hp / character.max_hp) * 100;

  return (
    <div className="h-full flex flex-col">
      {/* Header - Always visible */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold">{character.name}</h1>
            <p className="text-sm text-muted-foreground">
              Level {character.level} {character.class}
              {character.subclass_id && " • Subclass"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <StickyNote className="h-4 w-4 mr-2" />
              Quick Rest
            </Button>
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="grid grid-cols-6 gap-3 text-center">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">HP</span>
            <div className="space-y-1">
              <span className="text-lg font-bold">{character.current_hp}/{character.max_hp}</span>
              <Progress value={hpPercent} className="h-1" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Temp HP</span>
            <span className="text-lg font-bold">{character.temp_hp || 0}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">AC</span>
            <span className="text-lg font-bold">{character.ac}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Speed</span>
            <span className="text-lg font-bold">{character.speed} ft</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Prof</span>
            <span className="text-lg font-bold">+{profBonus}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Passive Per</span>
            <span className="text-lg font-bold">{character.passive_perception}</span>
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="w-full justify-start border-b rounded-none px-4">
            <TabsTrigger value="overview">
              <User className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="abilities">
              <Zap className="h-4 w-4 mr-2" />
              Abilities
            </TabsTrigger>
            <TabsTrigger value="skills">
              <BookOpen className="h-4 w-4 mr-2" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="combat">
              <Sword className="h-4 w-4 mr-2" />
              Combat
            </TabsTrigger>
            <TabsTrigger value="features">
              <Sparkles className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            {spells.length > 0 && (
              <TabsTrigger value="spells">
                <Sparkles className="h-4 w-4 mr-2" />
                Spells
              </TabsTrigger>
            )}
            <TabsTrigger value="notes">
              <StickyNote className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="overview" className="mt-0">
              <OverviewTab 
                character={character} 
                abilities={abilities}
                profBonus={profBonus}
                languages={languages}
              />
            </TabsContent>

            <TabsContent value="abilities" className="mt-0">
              <AbilitiesTab 
                abilities={abilities} 
                saves={saves}
                character={character}
                profBonus={profBonus}
              />
            </TabsContent>

            <TabsContent value="skills" className="mt-0">
              <SkillsTab 
                skills={skills}
                abilities={abilities}
                profBonus={profBonus}
                proficiencies={proficiencies}
                languages={languages}
              />
            </TabsContent>

            <TabsContent value="combat" className="mt-0">
              <CombatTab 
                character={character}
                attacks={attacks}
                equipment={equipment}
              />
            </TabsContent>

            <TabsContent value="features" className="mt-0">
              <FeaturesTab features={features} feats={feats} />
            </TabsContent>

            {spells.length > 0 && (
              <TabsContent value="spells" className="mt-0">
                <SpellsTab 
                  spells={spells}
                  character={character}
                  abilities={abilities}
                />
              </TabsContent>
            )}

            <TabsContent value="notes" className="mt-0">
              <NotesTab character={character} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Defenses Editor Dialog */}
      <DefensesEditor
        open={showDefensesEditor}
        onOpenChange={setShowDefensesEditor}
        characterId={character.id}
        currentResistances={(character.resistances || []) as DamageType[]}
        currentVulnerabilities={(character.vulnerabilities || []) as DamageType[]}
        currentImmunities={(character.immunities || []) as DamageType[]}
        onUpdate={loadCharacter}
      />
    </div>
  );
};

// Tab Components
const OverviewTab = ({ character, abilities, profBonus, languages }: any) => {
  const initiative = calculateModifier(abilities.dex);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground mb-1">Proficiency</div>
            <div className="text-2xl font-bold">+{profBonus}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground mb-1">Initiative</div>
            <div className="text-2xl font-bold">
              {initiative >= 0 ? '+' : ''}{initiative}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground mb-1">Speed</div>
            <div className="text-2xl font-bold">{character.speed} ft</div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Panel */}
      <ResourcePanel characterId={character.id} canEdit={false} />

      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang: any) => (
              <Badge key={lang.id} variant="secondary">{lang.name}</Badge>
            ))}
            {languages.length === 0 && (
              <span className="text-sm text-muted-foreground">No languages recorded</span>
            )}
          </div>
        </CardContent>
      </Card>

      <DefensesPanel
        resistances={(character.resistances || []) as DamageType[]}
        vulnerabilities={(character.vulnerabilities || []) as DamageType[]}
        immunities={(character.immunities || []) as DamageType[]}
      />

      {character.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Character Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{character.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const AbilitiesTab = ({ abilities, saves, character, profBonus }: any) => {
  const ABILITIES = [
    { key: "str", label: "Strength", save: "str" },
    { key: "dex", label: "Dexterity", save: "dex" },
    { key: "con", label: "Constitution", save: "con" },
    { key: "int", label: "Intelligence", save: "int" },
    { key: "wis", label: "Wisdom", save: "wis" },
    { key: "cha", label: "Charisma", save: "cha" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {ABILITIES.map((ability) => {
          const score = abilities[ability.key];
          const modifier = calculateModifier(score);
          const isProficient = saves?.[ability.save] || false;
          const saveBonus = modifier + (isProficient ? profBonus : 0);

          return (
            <Card key={ability.key}>
              <CardContent className="pt-6 text-center">
                <div className="text-sm text-muted-foreground mb-2">{ability.label}</div>
                <div className="text-4xl font-bold mb-2">{score}</div>
                <div className="text-lg text-muted-foreground mb-3">
                  ({modifier >= 0 ? '+' : ''}{modifier})
                </div>
                <Separator className="my-3" />
                <div className="text-sm">
                  <div className="text-muted-foreground mb-1">Saving Throw</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-bold">
                      {saveBonus >= 0 ? '+' : ''}{saveBonus}
                    </span>
                    {isProficient && (
                      <Badge variant="secondary" className="text-xs">Prof</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const SkillsTab = ({ skills, abilities, profBonus, proficiencies, languages }: any) => {
  const SKILLS = [
    { name: "Acrobatics", ability: "dex" },
    { name: "Animal Handling", ability: "wis" },
    { name: "Arcana", ability: "int" },
    { name: "Athletics", ability: "str" },
    { name: "Deception", ability: "cha" },
    { name: "History", ability: "int" },
    { name: "Insight", ability: "wis" },
    { name: "Intimidation", ability: "cha" },
    { name: "Investigation", ability: "int" },
    { name: "Medicine", ability: "wis" },
    { name: "Nature", ability: "int" },
    { name: "Perception", ability: "wis" },
    { name: "Performance", ability: "cha" },
    { name: "Persuasion", ability: "cha" },
    { name: "Religion", ability: "int" },
    { name: "Sleight of Hand", ability: "dex" },
    { name: "Stealth", ability: "dex" },
    { name: "Survival", ability: "wis" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SKILLS.map((skill) => {
              const skillData = skills.find((s: any) => s.skill === skill.name);
              const isProficient = skillData?.proficient || false;
              const hasExpertise = skillData?.expertise || false;
              const abilityScore = abilities[skill.ability];
              const modifier = calculateModifier(abilityScore);
              const bonus = modifier + (isProficient ? profBonus : 0) + (hasExpertise ? profBonus : 0);

              return (
                <div key={skill.name} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{skill.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {skill.ability.toUpperCase()}
                    </Badge>
                    {isProficient && (
                      <Badge variant="secondary" className="text-xs">
                        {hasExpertise ? "Expertise" : "Prof"}
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono font-bold">
                    {bonus >= 0 ? '+' : ''}{bonus}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proficiencies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {['armor', 'weapon', 'tool'].map((type) => {
            const items = proficiencies.filter((p: any) => p.type === type);
            if (items.length === 0) return null;
            
            return (
              <div key={type}>
                <h4 className="font-medium mb-2 capitalize">{type}</h4>
                <div className="flex flex-wrap gap-2">
                  {items.map((item: any) => (
                    <Badge key={item.id} variant="outline">{item.name}</Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

const CombatTab = ({ character, attacks, equipment }: any) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attacks</CardTitle>
        </CardHeader>
        <CardContent>
          {attacks.length > 0 ? (
            <div className="space-y-3">
              {attacks.map((attack: any) => (
                <div key={attack.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{attack.name}</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Roll Attack</Button>
                      <Button size="sm" variant="outline">Roll Damage</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Attack: </span>
                      <span className="font-bold">+{attack.attack_bonus}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Damage: </span>
                      <span className="font-bold">{attack.damage}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type: </span>
                      <span>{attack.damage_type}</span>
                    </div>
                  </div>
                  {attack.properties && attack.properties.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {attack.properties.map((prop: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{prop}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attacks configured</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          {equipment.length > 0 ? (
            <div className="space-y-2">
              {equipment.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.item_ref}</span>
                    {item.equipped && <Badge variant="secondary" className="text-xs">Equipped</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">×{item.qty}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No equipment</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const FeaturesTab = ({ features, feats }: any) => {
  const groupedFeatures = features.reduce((acc: any, feature: any) => {
    if (!acc[feature.source]) {
      acc[feature.source] = [];
    }
    acc[feature.source].push(feature);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Feats Section */}
      {feats && feats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Feats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feats.map((characterFeat: any) => (
              <div key={characterFeat.id} className="border-l-2 border-accent pl-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{characterFeat.feat?.name || "Unknown Feat"}</h4>
                  <Badge variant="outline" className="text-xs">
                    Level {characterFeat.level_gained}
                  </Badge>
                </div>
                {characterFeat.feat?.description && (
                  <p className="text-sm text-muted-foreground">
                    {characterFeat.feat.description}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Class Features Section */}
      {Object.entries(groupedFeatures).map(([source, sourceFeatures]: [string, any]) => (
        <Card key={source}>
          <CardHeader>
            <CardTitle className="capitalize">{source} Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourceFeatures.map((feature: any) => (
              <div key={feature.id} className="border-l-2 border-primary pl-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{feature.name}</h4>
                  <Badge variant="outline" className="text-xs">Level {feature.level}</Badge>
                </div>
                {feature.description && (
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      
      {features.length === 0 && (!feats || feats.length === 0) && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No features or feats recorded</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const SpellsTab = ({ spells, character, abilities, onOpenSpellPreparation, onOpenCustomSpell, onOpenSpellbook }: any) => {
  const groupedSpells = spells.reduce((acc: any, spell: any) => {
    const level = spell.spell?.level || 0;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(spell);
    return acc;
  }, {});

  const isSpellcaster = character.spell_ability || spells.length > 0;
  const isWizard = character.class === "Wizard";
  const canPrepareSpells = ["Cleric", "Druid", "Paladin", "Wizard"].includes(character.class);

  return (
    <div className="space-y-6">
      {isSpellcaster && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spellcasting</CardTitle>
                <div className="flex gap-2">
                  {canPrepareSpells && (
                    <Button size="sm" variant="outline" onClick={onOpenSpellPreparation}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Prepare Spells
                    </Button>
                  )}
                  {isWizard && (
                    <Button size="sm" variant="outline" onClick={onOpenSpellbook}>
                      <BookMarked className="h-4 w-4 mr-2" />
                      Spellbook
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={onOpenCustomSpell}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Custom Spell
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Spell Save DC</div>
                <div className="text-2xl font-bold">{character.spell_save_dc || "—"}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Spell Attack</div>
                <div className="text-2xl font-bold">
                  {character.spell_attack_mod ? `+${character.spell_attack_mod}` : "—"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Ability</div>
                <div className="text-2xl font-bold">{character.spell_ability?.toUpperCase() || "—"}</div>
              </div>
            </CardContent>
          </Card>

          <SpellSlotTracker
            characterId={character.id}
            characterLevel={character.level}
            characterClass={character.class}
          />
        </>
      )}

      {Object.entries(groupedSpells).sort(([a], [b]) => Number(a) - Number(b)).map(([level, levelSpells]: [string, any]) => (
        <Card key={level}>
          <CardHeader>
            <CardTitle>
              {level === "0" ? "Cantrips" : `Level ${level} Spells`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {levelSpells.map((spellData: any) => {
              const spell = spellData.spell;
              if (!spell) return null;
              
              return (
                <div key={spellData.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{spell.name}</h4>
                    <div className="flex gap-2">
                      {spellData.prepared && <Badge variant="secondary" className="text-xs">Prepared</Badge>}
                      {spell.concentration && <Badge variant="outline" className="text-xs">Concentration</Badge>}
                      {spell.ritual && <Badge variant="outline" className="text-xs">Ritual</Badge>}
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">School: </span>
                      <span>{spell.school}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Casting Time: </span>
                      <span>{spell.casting_time}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Range: </span>
                      <span>{spell.range}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration: </span>
                      <span>{spell.duration}</span>
                    </div>
                    {spell.description && (
                      <p className="text-muted-foreground mt-2">{spell.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const NotesTab = ({ character }: any) => {
  return (
    <div className="space-y-6">
      {character.alignment && (
        <Card>
          <CardHeader>
            <CardTitle>Alignment</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{character.alignment}</p>
          </CardContent>
        </Card>
      )}

      {(character.age || character.height || character.weight || character.eyes || character.skin || character.hair) && (
        <Card>
          <CardHeader>
            <CardTitle>Physical Description</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {character.age && (
              <div>
                <span className="text-muted-foreground">Age: </span>
                <span>{character.age}</span>
              </div>
            )}
            {character.height && (
              <div>
                <span className="text-muted-foreground">Height: </span>
                <span>{character.height}</span>
              </div>
            )}
            {character.weight && (
              <div>
                <span className="text-muted-foreground">Weight: </span>
                <span>{character.weight}</span>
              </div>
            )}
            {character.eyes && (
              <div>
                <span className="text-muted-foreground">Eyes: </span>
                <span>{character.eyes}</span>
              </div>
            )}
            {character.skin && (
              <div>
                <span className="text-muted-foreground">Skin: </span>
                <span>{character.skin}</span>
              </div>
            )}
            {character.hair && (
              <div>
                <span className="text-muted-foreground">Hair: </span>
                <span>{character.hair}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {character.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{character.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CharacterSheet;
