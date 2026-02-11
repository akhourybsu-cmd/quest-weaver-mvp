import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, SkipForward, Zap, Mountain, Sword, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GrappleShoveMenu from "@/components/combat/GrappleShoveMenu";
import EscapeGrappleButton from "@/components/combat/EscapeGrappleButton";
import { ReadiedActionDialog } from "@/components/combat/ReadiedActionDialog";
import { MountCombatManager } from "@/components/combat/MountCombatManager";
import { useMountedStatus } from "@/hooks/useMountedStatus";
import { PlayerAttackDialog } from "@/components/combat/PlayerAttackDialog";
import { AmmunitionTracker } from "@/components/combat/AmmunitionTracker";

interface PlayerCombatActionsProps {
  characterId: string;
  encounterId: string;
  isMyTurn: boolean;
}

interface CharacterAttack {
  id: string;
  name: string;
  attack_bonus: number;
  damage: string;
  damage_type: string | null;
  ability: string;
  properties: string[] | null;
}

/** Compute a skill modifier from ability score, proficiency bonus, and skill proficiency/expertise */
function computeSkillBonus(
  abilityScore: number,
  proficiencyBonus: number,
  proficient: boolean,
  expertise: boolean
): number {
  const mod = Math.floor((abilityScore - 10) / 2);
  let bonus = mod;
  if (proficient) bonus += proficiencyBonus;
  if (expertise) bonus += proficiencyBonus;
  return bonus;
}

export function PlayerCombatActions({
  characterId,
  encounterId,
  isMyTurn,
}: PlayerCombatActionsProps) {
  const [actionUsed, setActionUsed] = useState(false);
  const [bonusActionUsed, setBonusActionUsed] = useState(false);
  const [reactionUsed, setReactionUsed] = useState(false);
  const [showEndTurnDialog, setShowEndTurnDialog] = useState(false);
  const [character, setCharacter] = useState<any>(null);
  const [attacks, setAttacks] = useState<CharacterAttack[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [grappleCondition, setGrappleCondition] = useState<any>(null);
  const [showReadiedActionDialog, setShowReadiedActionDialog] = useState(false);
  const [showMountDialog, setShowMountDialog] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [availableMounts, setAvailableMounts] = useState<any[]>([]);
  const { toast } = useToast();
  
  const mountedStatus = useMountedStatus(encounterId, characterId, 'character');

  useEffect(() => {
    fetchActionEconomy();
    fetchCharacterData();
    fetchAttacks();
    fetchTargets();
    fetchGrappleCondition();
    fetchEncounterRound();
    fetchAvailableMounts();

    const channel = supabase
      .channel(`player-actions:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`,
        },
        () => fetchActionEconomy()
      )
      .subscribe();

    const conditionsChannel = supabase
      .channel(`grapple-check:${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_conditions',
          filter: `character_id=eq.${characterId}`,
        },
        () => fetchGrappleCondition()
      )
      .subscribe();

    const encounterChannel = supabase
      .channel(`encounter-round:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'encounters',
          filter: `id=eq.${encounterId}`,
        },
        () => fetchEncounterRound()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(conditionsChannel);
      supabase.removeChannel(encounterChannel);
    };
  }, [characterId, encounterId]);

  const fetchActionEconomy = async () => {
    const { data } = await supabase
      .from("characters")
      .select("action_used, bonus_action_used, reaction_used")
      .eq("id", characterId)
      .single();

    if (data) {
      setActionUsed(data.action_used || false);
      setBonusActionUsed(data.bonus_action_used || false);
      setReactionUsed(data.reaction_used || false);
    }
  };

  const fetchCharacterData = async () => {
    // Fetch character base data
    const { data } = await supabase
      .from("characters")
      .select("id, name, proficiency_bonus, size, exhaustion_level")
      .eq("id", characterId)
      .single();

    if (!data) return;

    // Fetch ability scores for STR and DEX
    const { data: abilities } = await supabase
      .from("character_abilities")
      .select("str, dex")
      .eq("character_id", characterId)
      .maybeSingle();

    // Fetch Athletics and Acrobatics skill proficiency
    const { data: skillData } = await supabase
      .from("character_skills")
      .select("skill, proficient, expertise")
      .eq("character_id", characterId)
      .in("skill", ["Athletics", "Acrobatics"]);

    const strScore = abilities?.str || 10;
    const dexScore = abilities?.dex || 10;
    const profBonus = data.proficiency_bonus || 2;

    const athleticsSkill = skillData?.find(s => s.skill === "Athletics");
    const acrobaticsSkill = skillData?.find(s => s.skill === "Acrobatics");

    const athleticsBonus = computeSkillBonus(
      strScore, profBonus,
      athleticsSkill?.proficient || false,
      athleticsSkill?.expertise || false
    );
    const acrobaticsBonus = computeSkillBonus(
      dexScore, profBonus,
      acrobaticsSkill?.proficient || false,
      acrobaticsSkill?.expertise || false
    );

    setCharacter({
      ...data,
      athleticsBonus,
      acrobaticsBonus,
    });
  };

  const fetchAttacks = async () => {
    const { data } = await supabase
      .from("character_attacks")
      .select("*")
      .eq("character_id", characterId)
      .order("name");

    if (data) {
      setAttacks(data);
    }
  };

  const fetchEncounterRound = async () => {
    const { data } = await supabase
      .from("encounters")
      .select("current_round")
      .eq("id", encounterId)
      .single();

    if (data) {
      setCurrentRound(data.current_round || 1);
    }
  };

  const fetchAvailableMounts = async () => {
    const { data: initData } = await supabase
      .from("initiative")
      .select("combatant_id, combatant_type")
      .eq("encounter_id", encounterId);

    if (!initData) return;

    const mounts = await Promise.all(
      initData.map(async (init) => {
        if (init.combatant_type === 'character' && init.combatant_id !== characterId) {
          const { data } = await supabase
            .from('characters')
            .select('id, name, size')
            .eq('id', init.combatant_id)
            .single();

          return data ? {
            id: data.id,
            name: data.name,
            type: 'character' as const,
            size: data.size || 'Medium',
          } : null;
        } else if (init.combatant_type === 'monster') {
          const { data } = await supabase
            .from('encounter_monsters')
            .select('id, display_name, size')
            .eq('id', init.combatant_id)
            .single();

          return data ? {
            id: data.id,
            name: data.display_name,
            type: 'monster' as const,
            size: data.size || 'Medium',
          } : null;
        }
        return null;
      })
    );

    setAvailableMounts(mounts.filter(Boolean) as any[]);
  };

  const fetchTargets = async () => {
    const { data: initData } = await supabase
      .from("initiative")
      .select("combatant_id, combatant_type")
      .eq("encounter_id", encounterId);

    if (!initData) return;

    const targetList = await Promise.all(
      initData
        .filter(i => !(i.combatant_type === 'character' && i.combatant_id === characterId))
        .map(async (init) => {
          if (init.combatant_type === 'character') {
            // Fetch actual skill data for other characters too
            const { data } = await supabase
              .from('characters')
              .select('id, name, proficiency_bonus')
              .eq('id', init.combatant_id)
              .single();

            if (!data) return null;

            const { data: abilities } = await supabase
              .from("character_abilities")
              .select("str, dex")
              .eq("character_id", init.combatant_id)
              .maybeSingle();

            const { data: skillData } = await supabase
              .from("character_skills")
              .select("skill, proficient, expertise")
              .eq("character_id", init.combatant_id)
              .in("skill", ["Athletics", "Acrobatics"]);

            const strScore = abilities?.str || 10;
            const dexScore = abilities?.dex || 10;
            const profBonus = data.proficiency_bonus || 2;
            const athSkill = skillData?.find(s => s.skill === "Athletics");
            const acroSkill = skillData?.find(s => s.skill === "Acrobatics");

            return {
              id: data.id,
              type: 'character' as const,
              name: data.name,
              athleticsBonus: computeSkillBonus(strScore, profBonus, athSkill?.proficient || false, athSkill?.expertise || false),
              acrobaticsBonus: computeSkillBonus(dexScore, profBonus, acroSkill?.proficient || false, acroSkill?.expertise || false),
            };
          } else {
            // Monster: derive Athletics/Acrobatics from abilities JSON and skills JSON
            const { data } = await supabase
              .from('encounter_monsters')
              .select('id, display_name, abilities, skills')
              .eq('id', init.combatant_id)
              .single();

            if (!data) return null;

            const abilities = (data.abilities || {}) as Record<string, number>;
            const skills = (data.skills || {}) as Record<string, number>;
            
            // Use explicit skill bonus if available, otherwise fall back to ability modifier
            const strMod = Math.floor(((abilities.str ?? 10) - 10) / 2);
            const dexMod = Math.floor(((abilities.dex ?? 10) - 10) / 2);
            const athleticsBonus = skills.athletics ?? skills.Athletics ?? strMod;
            const acrobaticsBonus = skills.acrobatics ?? skills.Acrobatics ?? dexMod;

            return {
              id: data.id,
              type: 'monster' as const,
              name: data.display_name,
              athleticsBonus,
              acrobaticsBonus,
            };
          }
        })
    );

    setTargets(targetList.filter(Boolean) as any[]);
  };

  const fetchGrappleCondition = async () => {
    const { data } = await supabase
      .from("character_conditions")
      .select("id, condition")
      .eq("character_id", characterId)
      .eq("encounter_id", encounterId)
      .eq("condition", "grappled")
      .maybeSingle();

    setGrappleCondition(data);
  };

  const handleEndTurn = async () => {
    try {
      const { error } = await supabase
        .from("player_turn_signals")
        .insert({
          encounter_id: encounterId,
          character_id: characterId,
          signal_type: "end_turn",
          message: "Player has ended their turn",
        });

      if (error) throw error;

      toast({
        title: "Turn Ended",
        description: "The DM has been notified that you've completed your turn.",
      });

      setShowEndTurnDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const ActionChip = ({ 
    used, 
    label, 
    fullLabel 
  }: { 
    used: boolean; 
    label: string;
    fullLabel: string;
  }) => (
    <div className="flex items-center gap-2">
      <Badge
        variant={used ? "outline" : "default"}
        className={`h-8 px-3 ${
          used 
            ? 'bg-muted/50 text-muted-foreground line-through' 
            : 'bg-primary text-primary-foreground'
        }`}
      >
        {used ? <X className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
        <span className="hidden sm:inline">{fullLabel}</span>
        <span className="sm:hidden">{label}</span>
      </Badge>
    </div>
  );

  if (!isMyTurn) {
    return null;
  }

  return (
    <>
      <Card className="border-primary shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Turn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Available Actions:</p>
            <div className="flex flex-wrap gap-2">
              <ActionChip used={actionUsed} label="A" fullLabel="Action" />
              <ActionChip used={bonusActionUsed} label="B" fullLabel="Bonus Action" />
              <ActionChip used={reactionUsed} label="R" fullLabel="Reaction" />
            </div>
          </div>

          {character && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Combat Options:</p>
              <div className="flex flex-wrap gap-2">
                {attacks.length > 0 ? (
                  attacks.map((attack) => (
                    <PlayerAttackDialog
                      key={attack.id}
                      characterName={character.name}
                      attackBonus={attack.attack_bonus}
                      weaponName={attack.name}
                      damageFormula={attack.damage}
                      exhaustionLevel={character.exhaustion_level || 0}
                    />
                  ))
                ) : (
                  <PlayerAttackDialog
                    characterName={character.name}
                    attackBonus={character.athleticsBonus}
                    weaponName="Unarmed Strike"
                    damageFormula="1 + STR"
                    exhaustionLevel={character.exhaustion_level || 0}
                  />
                )}
                <GrappleShoveMenu
                  attackerId={character.id}
                  attackerType="character"
                  attackerName={character.name}
                  attackerAthleticsBonus={character.athleticsBonus}
                  targets={targets}
                  encounterId={encounterId}
                  disabled={actionUsed}
                />
                {grappleCondition && (
                  <EscapeGrappleButton
                    characterId={character.id}
                    characterName={character.name}
                    athleticsBonus={character.athleticsBonus}
                    acrobaticsBonus={character.acrobaticsBonus}
                    encounterId={encounterId}
                    grapplerDC={15}
                    conditionId={grappleCondition.id}
                  />
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReadiedActionDialog(true)}
                  disabled={actionUsed}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Ready Action
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMountDialog(true)}
                >
                  <Mountain className="w-4 h-4 mr-1" />
                  {mountedStatus.isMounted ? 'Dismount' : 'Mount'}
                </Button>
              </div>
            </div>
          )}

          <AmmunitionTracker characterId={characterId} />

          <Button
            onClick={() => setShowEndTurnDialog(true)}
            className="w-full"
            size="lg"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            End My Turn
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showEndTurnDialog} onOpenChange={setShowEndTurnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Your Turn?</AlertDialogTitle>
            <AlertDialogDescription>
              This will notify the DM that you've completed your turn. The DM will advance the initiative order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndTurn}>
              End Turn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {character && (
        <>
          <ReadiedActionDialog
            open={showReadiedActionDialog}
            onOpenChange={setShowReadiedActionDialog}
            encounterId={encounterId}
            characterId={characterId}
            combatantName={character.name}
            currentRound={currentRound}
          />

          <MountCombatManager
            open={showMountDialog}
            onOpenChange={setShowMountDialog}
            encounterId={encounterId}
            riderId={characterId}
            riderType="character"
            riderName={character.name}
            riderSize={character.size || 'Medium'}
            currentRound={currentRound}
            availableMounts={availableMounts}
          />
        </>
      )}
    </>
  );
}
