import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Sparkles, Dices } from "lucide-react";

const SessionPlayer = () => {
  const [searchParams] = useSearchParams();
  const campaignCode = searchParams.get("campaign");
  
  const [character] = useState({
    name: "Theron Brightblade",
    class: "Paladin",
    level: 5,
    hp: 42,
    maxHp: 45,
    tempHp: 0,
    ac: 18,
    speed: 30,
    proficiencyBonus: 3,
    conditions: [] as string[],
    spellSlots: {
      1: { used: 2, max: 4 },
      2: { used: 0, max: 2 },
    },
  });

  const [isMyTurn] = useState(true);

  const getHPPercentage = () => (character.hp / character.maxHp) * 100;

  return (
    <div className="min-h-screen pb-20">
      {/* Turn Banner */}
      {isMyTurn && (
        <div className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="max-w-2xl mx-auto px-4 py-3 text-center">
            <p className="text-lg font-semibold">🎲 Your Turn!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{character.name}</h1>
            <p className="text-sm text-muted-foreground">
              Level {character.level} {character.class} • Campaign: {campaignCode || "Demo"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* HP Card */}
        <Card className="shadow-lg">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-status-hp" />
                <span className="text-lg font-semibold">Hit Points</span>
              </div>
              <span className="text-3xl font-bold tabular-nums">
                {character.hp}
                <span className="text-xl text-muted-foreground">/{character.maxHp}</span>
              </span>
            </div>
            
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-status-hp transition-all duration-300"
                style={{ width: `${getHPPercentage()}%` }}
              />
            </div>

            {character.tempHp > 0 && (
              <div className="text-sm text-muted-foreground">
                +{character.tempHp} Temporary HP
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" size="sm">
                - Damage
              </Button>
              <Button variant="outline" size="sm" className="bg-status-buff/10">
                + Healing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-md">
            <CardContent className="pt-4 pb-3 text-center">
              <Shield className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{character.ac}</div>
              <div className="text-xs text-muted-foreground">Armor Class</div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="pt-4 pb-3 text-center">
              <Sparkles className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">+{character.proficiencyBonus}</div>
              <div className="text-xs text-muted-foreground">Proficiency</div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="pt-4 pb-3 text-center">
              <Zap className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{character.speed}</div>
              <div className="text-xs text-muted-foreground">Speed (ft)</div>
            </CardContent>
          </Card>
        </div>

        {/* Spell Slots */}
        <Card className="shadow-md">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Spell Slots</span>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                Short Rest
              </Button>
            </div>
            
            {Object.entries(character.spellSlots).map(([level, slots]) => (
              <div key={level} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Level {level}</span>
                  <span className="font-medium tabular-nums">
                    {slots.max - slots.used} / {slots.max}
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: slots.max }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full transition-colors ${
                        i < slots.max - slots.used
                          ? "bg-secondary"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conditions */}
        {character.conditions.length > 0 && (
          <Card className="shadow-md">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <span className="font-semibold text-sm">Active Conditions</span>
                <div className="flex flex-wrap gap-2">
                  {character.conditions.map((condition) => (
                    <Badge
                      key={condition}
                      variant="outline"
                      className="bg-status-debuff/10 border-status-debuff text-status-debuff"
                    >
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary Action Button */}
        <Button
          size="lg"
          className="w-full h-16 text-lg font-semibold shadow-lg"
        >
          <Dices className="w-6 h-6 mr-3" />
          Roll Dice
        </Button>
      </div>

      <BottomNav role="player" />
    </div>
  );
};

const Zap = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    strokeWidth="2"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
  </svg>
);

export default SessionPlayer;
