import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Dices, Footprints, BookOpen, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// 5e SRD Conditions
const CONDITIONS = [
  { name: "Blinded", description: "A blinded creature can't see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage." },
  { name: "Charmed", description: "A charmed creature can't attack the charmer or target them with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature." },
  { name: "Deafened", description: "A deafened creature can't hear and automatically fails any ability check that requires hearing." },
  { name: "Exhaustion", description: "Exhaustion is measured in six levels. Level 1: Disadvantage on ability checks. Level 2: Speed halved. Level 3: Disadvantage on attack rolls and saving throws. Level 4: Hit point maximum halved. Level 5: Speed reduced to 0. Level 6: Death." },
  { name: "Frightened", description: "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can't willingly move closer to the source of its fear." },
  { name: "Grappled", description: "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature from the grappler's reach." },
  { name: "Incapacitated", description: "An incapacitated creature can't take actions or reactions." },
  { name: "Invisible", description: "An invisible creature is impossible to see without the aid of magic or a special sense. The creature is heavily obscured for the purpose of hiding. Attack rolls against the creature have disadvantage, and the creature's attack rolls have advantage." },
  { name: "Paralyzed", description: "A paralyzed creature is incapacitated and can't move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits is a critical hit if the attacker is within 5 feet." },
  { name: "Petrified", description: "A petrified creature is transformed, along with any nonmagical objects it's wearing or carrying, into a solid inanimate substance. Its weight increases by a factor of ten, and it ceases aging. The creature is incapacitated, can't move or speak, and is unaware of its surroundings." },
  { name: "Poisoned", description: "A poisoned creature has disadvantage on attack rolls and ability checks." },
  { name: "Prone", description: "A prone creature's only movement option is to crawl, unless it stands up. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet; otherwise, the attack roll has disadvantage." },
  { name: "Restrained", description: "A restrained creature's speed becomes 0. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws." },
  { name: "Stunned", description: "A stunned creature is incapacitated, can't move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage." },
  { name: "Unconscious", description: "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings. The creature drops whatever it's holding and falls prone. Attack rolls against the creature have advantage. Any attack that hits is a critical hit if the attacker is within 5 feet." },
];

// Dice roller
function rollDice(expression: string): { total: number; rolls: number[]; expression: string } {
  const match = expression.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return { total: 0, rolls: [], expression };
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  return { total, rolls, expression };
}

// Travel calculator
const TRAVEL_PACES = {
  fast: { milesPerHour: 4, milesPerDay: 30, effect: "-5 penalty to passive Perception" },
  normal: { milesPerHour: 3, milesPerDay: 24, effect: "—" },
  slow: { milesPerHour: 2, milesPerDay: 18, effect: "Able to use Stealth" },
};

export function DMToolsTab() {
  const [conditionSearch, setConditionSearch] = useState("");
  const [diceExpression, setDiceExpression] = useState("1d20");
  const [diceResults, setDiceResults] = useState<{ total: number; rolls: number[]; expression: string }[]>([]);
  const [travelDistance, setTravelDistance] = useState("24");
  const [travelPace, setTravelPace] = useState<"fast" | "normal" | "slow">("normal");
  const { toast } = useToast();

  const filteredConditions = useMemo(() =>
    CONDITIONS.filter(c =>
      c.name.toLowerCase().includes(conditionSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(conditionSearch.toLowerCase())
    ), [conditionSearch]);

  const handleRoll = () => {
    const result = rollDice(diceExpression);
    if (result.rolls.length === 0) {
      toast({ title: "Invalid dice expression", description: "Use format like 2d6+3", variant: "destructive" });
      return;
    }
    setDiceResults(prev => [result, ...prev.slice(0, 19)]);
  };

  const travelCalc = useMemo(() => {
    const dist = parseFloat(travelDistance) || 0;
    const pace = TRAVEL_PACES[travelPace];
    const hours = dist / pace.milesPerHour;
    const days = dist / pace.milesPerDay;
    const encounterChecks = Math.max(1, Math.floor(hours / 1));
    return { hours: hours.toFixed(1), days: days.toFixed(1), encounterChecks, effect: pace.effect };
  }, [travelDistance, travelPace]);

  return (
    <div className="space-y-4">
      <h2 className="font-cinzel text-xl font-bold text-ink flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-brass" />
        DM Tools
      </h2>

      <Tabs defaultValue="conditions" className="h-full">
        <TabsList className="bg-card/50 border border-brass/20">
          <TabsTrigger value="conditions" className="gap-1.5">
            <Search className="w-3.5 h-3.5" />
            Conditions
          </TabsTrigger>
          <TabsTrigger value="dice" className="gap-1.5">
            <Dices className="w-3.5 h-3.5" />
            Dice Roller
          </TabsTrigger>
          <TabsTrigger value="travel" className="gap-1.5">
            <Footprints className="w-3.5 h-3.5" />
            Travel
          </TabsTrigger>
        </TabsList>

        {/* Conditions Reference */}
        <TabsContent value="conditions" className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conditions..."
              value={conditionSearch}
              onChange={(e) => setConditionSearch(e.target.value)}
              className="pl-9 bg-card/50 border-brass/20"
            />
          </div>
          <ScrollArea className="h-[calc(100vh-22rem)]">
            <div className="grid gap-3">
              {filteredConditions.map((condition) => (
                <Card key={condition.name} className="p-4 border-brass/20 bg-card/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-cinzel font-bold text-ink">{condition.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{condition.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(`${condition.name}: ${condition.description}`);
                        toast({ title: "Copied!" });
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Dice Roller */}
        <TabsContent value="dice" className="mt-4">
          <Card className="p-4 border-brass/20 bg-card/50">
            <div className="flex gap-2 mb-4">
              <Input
                value={diceExpression}
                onChange={(e) => setDiceExpression(e.target.value)}
                placeholder="2d6+3"
                className="bg-card/50 border-brass/20 font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleRoll()}
              />
              <Button onClick={handleRoll} className="shrink-0">
                <Dices className="w-4 h-4 mr-1" />
                Roll
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              {["1d20", "1d20+5", "2d6", "1d8+3", "4d6", "1d100", "2d10+2", "8d6"].map(expr => (
                <Button
                  key={expr}
                  variant="outline"
                  size="sm"
                  className="border-brass/20 text-xs"
                  onClick={() => { setDiceExpression(expr); setDiceResults(prev => [rollDice(expr), ...prev.slice(0, 19)]); }}
                >
                  {expr}
                </Button>
              ))}
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {diceResults.map((result, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${i === 0 ? "bg-arcanePurple/10 border border-arcanePurple/30" : "bg-card/30"}`}>
                    <Badge variant="outline" className="font-mono border-brass/30 text-brass shrink-0">
                      {result.expression}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-mono">
                      [{result.rolls.join(", ")}]
                    </span>
                    <span className="ml-auto font-cinzel font-bold text-ink text-lg">
                      {result.total}
                    </span>
                  </div>
                ))}
                {diceResults.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">Roll some dice!</p>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Travel Calculator */}
        <TabsContent value="travel" className="mt-4">
          <Card className="p-4 border-brass/20 bg-card/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Distance (miles)</Label>
                <Input
                  type="number"
                  value={travelDistance}
                  onChange={(e) => setTravelDistance(e.target.value)}
                  className="bg-card/50 border-brass/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Travel Pace</Label>
                <Select value={travelPace} onValueChange={(v) => setTravelPace(v as any)}>
                  <SelectTrigger className="bg-card/50 border-brass/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast (4 mph / 30 mi/day)</SelectItem>
                    <SelectItem value="normal">Normal (3 mph / 24 mi/day)</SelectItem>
                    <SelectItem value="slow">Slow (2 mph / 18 mi/day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-3 border-brass/20 bg-card/30 text-center">
                <p className="text-xs text-muted-foreground">Travel Time</p>
                <p className="font-cinzel font-bold text-lg text-ink">{travelCalc.hours}h</p>
              </Card>
              <Card className="p-3 border-brass/20 bg-card/30 text-center">
                <p className="text-xs text-muted-foreground">Days</p>
                <p className="font-cinzel font-bold text-lg text-ink">{travelCalc.days}</p>
              </Card>
              <Card className="p-3 border-brass/20 bg-card/30 text-center">
                <p className="text-xs text-muted-foreground">Encounter Checks</p>
                <p className="font-cinzel font-bold text-lg text-ink">{travelCalc.encounterChecks}</p>
              </Card>
              <Card className="p-3 border-brass/20 bg-card/30 text-center">
                <p className="text-xs text-muted-foreground">Pace Effect</p>
                <p className="text-sm text-ink">{travelCalc.effect}</p>
              </Card>
            </div>

            <div className="mt-6">
              <h4 className="font-cinzel font-bold text-ink mb-2">Forced March</h4>
              <p className="text-sm text-muted-foreground">
                After 8 hours of travel, each additional hour requires a DC {10} + (hours past 8) Constitution saving throw or gain 1 level of exhaustion.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
