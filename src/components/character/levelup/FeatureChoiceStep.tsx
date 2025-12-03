import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Swords, Sparkles, Star, Shield } from "lucide-react";
import { 
  FeatureChoice, 
  FIGHTING_STYLES, 
  METAMAGIC_OPTIONS, 
  PACT_BOONS,
  EXPERTISE_SKILLS 
} from "@/lib/rules/levelUpRules";

interface FeatureChoiceStepProps {
  choice: FeatureChoice;
  className: string;
  currentProficientSkills: string[];
  currentExpertiseSkills: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}

export const FeatureChoiceStep = ({
  choice,
  className,
  currentProficientSkills,
  currentExpertiseSkills,
  selectedValues,
  onSelectionChange,
}: FeatureChoiceStepProps) => {
  const getChoiceTitle = () => {
    switch (choice.type) {
      case 'fighting_style': return 'Choose Fighting Style';
      case 'expertise': return 'Choose Expertise';
      case 'metamagic': return 'Choose Metamagic Options';
      case 'pact_boon': return 'Choose Pact Boon';
      case 'invocation': return 'Choose Eldritch Invocations';
      default: return 'Make Your Choice';
    }
  };

  const getChoiceDescription = () => {
    switch (choice.type) {
      case 'fighting_style': 
        return 'Adopt a particular style of fighting as your specialty.';
      case 'expertise': 
        return `Choose ${choice.count} skill${choice.count > 1 ? 's' : ''} you are proficient in. Your proficiency bonus is doubled for any ability check you make that uses the chosen skill${choice.count > 1 ? 's' : ''}.`;
      case 'metamagic': 
        return `Choose ${choice.count} Metamagic option${choice.count > 1 ? 's' : ''} to enhance your spells with sorcery points.`;
      case 'pact_boon': 
        return 'Your otherworldly patron bestows a gift upon you for your loyal service.';
      default: 
        return '';
    }
  };

  const getIcon = () => {
    switch (choice.type) {
      case 'fighting_style': return <Swords className="h-5 w-5 text-primary" />;
      case 'expertise': return <Star className="h-5 w-5 text-primary" />;
      case 'metamagic': return <Sparkles className="h-5 w-5 text-primary" />;
      case 'pact_boon': return <Shield className="h-5 w-5 text-primary" />;
      default: return <Star className="h-5 w-5 text-primary" />;
    }
  };

  const handleToggle = (value: string) => {
    if (choice.count === 1) {
      // Single selection (radio-like)
      onSelectionChange([value]);
    } else {
      // Multi-selection
      if (selectedValues.includes(value)) {
        onSelectionChange(selectedValues.filter(v => v !== value));
      } else if (selectedValues.length < choice.count) {
        onSelectionChange([...selectedValues, value]);
      }
    }
  };

  const renderFightingStyles = () => {
    const options = choice.options || FIGHTING_STYLES[className] || [];
    
    const styleDescriptions: Record<string, string> = {
      'Archery': '+2 bonus to attack rolls with ranged weapons.',
      'Defense': '+1 bonus to AC while wearing armor.',
      'Dueling': '+2 bonus to damage rolls when wielding a melee weapon in one hand and no other weapons.',
      'Great Weapon Fighting': 'Reroll 1s and 2s on damage dice with two-handed weapons.',
      'Protection': 'Impose disadvantage on attacks against adjacent allies using your reaction.',
      'Two-Weapon Fighting': 'Add your ability modifier to the damage of off-hand attacks.',
    };

    return (
      <RadioGroup value={selectedValues[0] || ""} onValueChange={(v) => onSelectionChange([v])}>
        <div className="space-y-2">
          {options.map(style => (
            <div
              key={style}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedValues.includes(style)
                  ? "bg-primary/20 border-primary/40"
                  : "hover:bg-muted/50 border-border"
              }`}
              onClick={() => handleToggle(style)}
            >
              <RadioGroupItem value={style} id={style} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={style} className="font-medium cursor-pointer">
                  {style}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {styleDescriptions[style]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>
    );
  };

  const renderExpertise = () => {
    // Only show skills the character is proficient in but doesn't have expertise in
    const eligibleSkills = currentProficientSkills.filter(
      skill => !currentExpertiseSkills.includes(skill)
    );

    return (
      <div className="space-y-2">
        {eligibleSkills.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No eligible skills available for expertise.
          </p>
        ) : (
          eligibleSkills.map(skill => {
            const isSelected = selectedValues.includes(skill);
            const isDisabled = !isSelected && selectedValues.length >= choice.count;
            
            return (
              <div
                key={skill}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/20 border-primary/40"
                    : isDisabled
                      ? "opacity-50 cursor-not-allowed border-border"
                      : "hover:bg-muted/50 border-border"
                }`}
                onClick={() => !isDisabled && handleToggle(skill)}
              >
                <Checkbox checked={isSelected} disabled={isDisabled} />
                <span className="font-medium">{skill}</span>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderMetamagic = () => {
    return (
      <div className="space-y-2">
        {METAMAGIC_OPTIONS.map(option => {
          const isSelected = selectedValues.includes(option.id);
          const isDisabled = !isSelected && selectedValues.length >= choice.count;
          
          return (
            <div
              key={option.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isSelected
                  ? "bg-primary/20 border-primary/40"
                  : isDisabled
                    ? "opacity-50 cursor-not-allowed border-border"
                    : "hover:bg-muted/50 border-border"
              }`}
              onClick={() => !isDisabled && handleToggle(option.id)}
            >
              <Checkbox checked={isSelected} disabled={isDisabled} className="mt-1" />
              <div className="flex-1">
                <span className="font-medium">{option.name}</span>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPactBoon = () => {
    return (
      <RadioGroup value={selectedValues[0] || ""} onValueChange={(v) => onSelectionChange([v])}>
        <div className="space-y-2">
          {PACT_BOONS.map(boon => (
            <div
              key={boon.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedValues.includes(boon.id)
                  ? "bg-primary/20 border-primary/40"
                  : "hover:bg-muted/50 border-border"
              }`}
              onClick={() => handleToggle(boon.id)}
            >
              <RadioGroupItem value={boon.id} id={boon.id} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={boon.id} className="font-medium cursor-pointer">
                  {boon.name}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">{boon.description}</p>
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>
    );
  };

  const renderChoices = () => {
    switch (choice.type) {
      case 'fighting_style': return renderFightingStyles();
      case 'expertise': return renderExpertise();
      case 'metamagic': return renderMetamagic();
      case 'pact_boon': return renderPactBoon();
      default: return <p className="text-muted-foreground">Unknown choice type</p>;
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          {getChoiceTitle()}
        </CardTitle>
        <CardDescription>{getChoiceDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Selection counter for multi-select */}
        {choice.count > 1 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
            <span className="text-sm font-medium">Selections Made</span>
            <Badge variant={selectedValues.length === choice.count ? "default" : "secondary"}>
              {selectedValues.length} / {choice.count}
            </Badge>
          </div>
        )}
        
        <ScrollArea className="max-h-[400px] pr-4">
          {renderChoices()}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
