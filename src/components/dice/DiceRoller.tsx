import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dices, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiceRollResult {
  die: string;
  rolls: number[];
  total: number;
}

const DiceRoller = () => {
  const [modifier, setModifier] = useState("");
  const [results, setResults] = useState<DiceRollResult[]>([]);
  const { toast } = useToast();

  const rollDice = (dieType: string, count: number = 1) => {
    const sides = parseInt(dieType.replace("d", ""));
    const rolls: number[] = [];

    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = rolls.reduce((sum, roll) => sum + roll, 0);
    const mod = parseInt(modifier) || 0;
    const finalTotal = total + mod;

    const newResult: DiceRollResult = {
      die: `${count}${dieType}`,
      rolls,
      total: finalTotal,
    };

    setResults([newResult, ...results.slice(0, 4)]);

    toast({
      title: "Rolled!",
      description: `${count}${dieType}${mod !== 0 ? ` ${mod >= 0 ? "+" : ""}${mod}` : ""} = ${finalTotal}`,
    });
  };

  const commonDice = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dices className="w-5 h-5" />
          Dice Roller
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modifier Input */}
        <div className="space-y-2">
          <Label htmlFor="modifier">Modifier</Label>
          <div className="flex gap-2">
            <Input
              id="modifier"
              type="number"
              value={modifier}
              onChange={(e) => setModifier(e.target.value)}
              placeholder="0"
              className="w-24"
            />
            <span className="text-sm text-muted-foreground self-center">
              (Optional +/- to all rolls)
            </span>
          </div>
        </div>

        {/* Common Dice */}
        <div className="grid grid-cols-4 gap-2">
          {commonDice.map((die) => (
            <Button
              key={die}
              variant="outline"
              onClick={() => rollDice(die)}
              className="h-16 text-lg font-bold"
            >
              {die.toUpperCase()}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => rollDice("d20", 2)}
            className="h-16 text-sm font-bold"
          >
            2d20
            <br />
            <span className="text-xs font-normal">(Advantage)</span>
          </Button>
        </div>

        {/* Multi-Dice Shortcuts */}
        <div className="space-y-2">
          <Label>Common Rolls</Label>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => rollDice("d6", 2)}>
              2d6
            </Button>
            <Button variant="secondary" size="sm" onClick={() => rollDice("d6", 3)}>
              3d6
            </Button>
            <Button variant="secondary" size="sm" onClick={() => rollDice("d6", 4)}>
              4d6
            </Button>
            <Button variant="secondary" size="sm" onClick={() => rollDice("d8", 2)}>
              2d8
            </Button>
            <Button variant="secondary" size="sm" onClick={() => rollDice("d10", 2)}>
              2d10
            </Button>
          </div>
        </div>

        {/* Roll History */}
        {results.length > 0 && (
          <div className="space-y-2">
            <Label>Recent Rolls</Label>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="bg-muted/50 rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{result.die}</span>
                    <Badge variant="outline" className="text-lg font-bold">
                      {result.total}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rolls: {result.rolls.join(", ")}
                    {modifier && ` (${parseInt(modifier) >= 0 ? "+" : ""}${modifier})`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiceRoller;
