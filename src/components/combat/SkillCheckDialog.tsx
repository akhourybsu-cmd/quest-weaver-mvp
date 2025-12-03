import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dices, Brain, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AbilityType = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';

const ABILITIES: { value: AbilityType; label: string }[] = [
  { value: 'STR', label: 'Strength' },
  { value: 'DEX', label: 'Dexterity' },
  { value: 'CON', label: 'Constitution' },
  { value: 'INT', label: 'Intelligence' },
  { value: 'WIS', label: 'Wisdom' },
  { value: 'CHA', label: 'Charisma' },
];

const SKILLS: { name: string; ability: AbilityType }[] = [
  { name: 'Acrobatics', ability: 'DEX' },
  { name: 'Animal Handling', ability: 'WIS' },
  { name: 'Arcana', ability: 'INT' },
  { name: 'Athletics', ability: 'STR' },
  { name: 'Deception', ability: 'CHA' },
  { name: 'History', ability: 'INT' },
  { name: 'Insight', ability: 'WIS' },
  { name: 'Intimidation', ability: 'CHA' },
  { name: 'Investigation', ability: 'INT' },
  { name: 'Medicine', ability: 'WIS' },
  { name: 'Nature', ability: 'INT' },
  { name: 'Perception', ability: 'WIS' },
  { name: 'Performance', ability: 'CHA' },
  { name: 'Persuasion', ability: 'CHA' },
  { name: 'Religion', ability: 'INT' },
  { name: 'Sleight of Hand', ability: 'DEX' },
  { name: 'Stealth', ability: 'DEX' },
  { name: 'Survival', ability: 'WIS' },
];

interface SkillCheckDialogProps {
  encounterId?: string;
  campaignId: string;
  characters: Array<{
    id: string;
    name: string;
    exhaustion_level?: number;
  }>;
  onCheckRequested?: (checkInfo: {
    type: 'ability' | 'skill';
    ability?: AbilityType;
    skill?: string;
    dc: number;
    characterIds: string[];
    advantageMode: AdvantageMode;
  }) => void;
  trigger?: React.ReactNode;
}

export const SkillCheckDialog: React.FC<SkillCheckDialogProps> = ({
  encounterId,
  campaignId,
  characters,
  onCheckRequested,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [checkType, setCheckType] = useState<'ability' | 'skill'>('skill');
  const [selectedAbility, setSelectedAbility] = useState<AbilityType>('STR');
  const [selectedSkill, setSelectedSkill] = useState<string>('Perception');
  const [dc, setDC] = useState<number>(15);
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const resetState = useCallback(() => {
    setCheckType('skill');
    setSelectedAbility('STR');
    setSelectedSkill('Perception');
    setDC(15);
    setAdvantageMode('normal');
    setSelectedCharacters([]);
    setSelectAll(false);
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetState();
  }, [resetState]);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked);
    setSelectedCharacters(checked ? characters.map(c => c.id) : []);
  }, [characters]);

  const handleCharacterToggle = useCallback((characterId: string) => {
    setSelectedCharacters(prev => {
      if (prev.includes(characterId)) {
        return prev.filter(id => id !== characterId);
      }
      return [...prev, characterId];
    });
  }, []);

  const handleRequestCheck = useCallback(async () => {
    if (selectedCharacters.length === 0) {
      toast.error('Select at least one character');
      return;
    }

    const checkInfo = {
      type: checkType,
      ability: checkType === 'ability' ? selectedAbility : SKILLS.find(s => s.name === selectedSkill)?.ability,
      skill: checkType === 'skill' ? selectedSkill : undefined,
      dc,
      characterIds: selectedCharacters,
      advantageMode,
    };

    // Create a save prompt for the check (reusing save_prompts infrastructure)
    if (encounterId) {
      const { error } = await supabase.from('save_prompts').insert([{
        encounter_id: encounterId,
        ability: checkInfo.ability || 'STR',
        dc,
        description: checkType === 'skill' 
          ? `${selectedSkill} check (DC ${dc})`
          : `${selectedAbility} ability check (DC ${dc})`,
        target_scope: 'custom',
        advantage_mode: advantageMode,
        half_on_success: false,
        status: 'active',
      }]);

      if (error) {
        toast.error('Failed to create check request');
        console.error(error);
        return;
      }
    }

    onCheckRequested?.(checkInfo);
    toast.success(`${checkType === 'skill' ? selectedSkill : selectedAbility} check requested (DC ${dc})`);
    setOpen(false);
  }, [checkType, selectedAbility, selectedSkill, dc, selectedCharacters, advantageMode, encounterId, onCheckRequested]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Dices className="h-4 w-4 mr-2" />
            Request Check
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Request Ability/Skill Check
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Check Type */}
          <div className="space-y-2">
            <Label>Check Type</Label>
            <Select value={checkType} onValueChange={(v) => setCheckType(v as 'ability' | 'skill')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ability">Ability Check</SelectItem>
                <SelectItem value="skill">Skill Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ability or Skill Selection */}
          {checkType === 'ability' ? (
            <div className="space-y-2">
              <Label>Ability</Label>
              <Select value={selectedAbility} onValueChange={(v) => setSelectedAbility(v as AbilityType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ABILITIES.map(ability => (
                    <SelectItem key={ability.value} value={ability.value}>
                      {ability.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Skill</Label>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILLS.map(skill => (
                    <SelectItem key={skill.name} value={skill.name}>
                      {skill.name} ({skill.ability})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* DC */}
          <div className="space-y-2">
            <Label htmlFor="dc">Difficulty Class (DC)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="dc"
                type="number"
                value={dc}
                onChange={(e) => setDC(parseInt(e.target.value) || 10)}
                min={5}
                max={30}
                className="w-24"
              />
              <div className="flex gap-1">
                {[10, 15, 20].map(preset => (
                  <Button
                    key={preset}
                    variant={dc === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDC(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Easy: 10 | Medium: 15 | Hard: 20 | Very Hard: 25 | Nearly Impossible: 30
            </p>
          </div>

          {/* Advantage Mode */}
          <div className="space-y-2">
            <Label>Roll Type</Label>
            <Select value={advantageMode} onValueChange={(v) => setAdvantageMode(v as AdvantageMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="advantage">Advantage</SelectItem>
                <SelectItem value="disadvantage">Disadvantage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Character Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Characters</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="selectAll"
                  checked={selectAll}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
                <label htmlFor="selectAll" className="text-sm cursor-pointer">
                  Select All
                </label>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
              {characters.map(character => (
                <div key={character.id} className="flex items-center gap-2">
                  <Checkbox
                    id={character.id}
                    checked={selectedCharacters.includes(character.id)}
                    onCheckedChange={() => handleCharacterToggle(character.id)}
                  />
                  <label htmlFor={character.id} className="text-sm cursor-pointer flex-1">
                    {character.name}
                  </label>
                  {(character.exhaustion_level || 0) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      Exhaustion {character.exhaustion_level}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedCharacters.length} character(s) selected
            </p>
          </div>

          {/* Request Button */}
          <Button 
            onClick={handleRequestCheck} 
            className="w-full"
            disabled={selectedCharacters.length === 0}
          >
            <Shield className="h-4 w-4 mr-2" />
            Request {checkType === 'skill' ? selectedSkill : selectedAbility} Check (DC {dc})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
