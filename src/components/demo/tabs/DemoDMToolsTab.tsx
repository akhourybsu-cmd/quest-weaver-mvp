import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dice5, BookOpen, Wand2, ScrollText, Calculator, Search } from "lucide-react";

export function DemoDMToolsTab() {
  const tools = [
    { icon: Dice5, name: "Dice Roller", description: "Roll any combination of dice with modifiers and advantage/disadvantage.", tag: "Core" },
    { icon: BookOpen, name: "Rule Reference", description: "Quick lookup for conditions, actions, cover rules, and ability checks.", tag: "Reference" },
    { icon: Wand2, name: "AI NPC Generator", description: "Generate NPCs with backstories, stats, and personality traits using AI.", tag: "AI" },
    { icon: ScrollText, name: "AI Encounter Builder", description: "Create balanced encounters based on party level and desired difficulty.", tag: "AI" },
    { icon: Calculator, name: "XP Calculator", description: "Calculate encounter XP, adjusted XP, and per-player rewards.", tag: "Core" },
    { icon: Search, name: "Missing Lore Detector", description: "AI scans your campaign for referenced but undefined lore entries.", tag: "AI" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-cinzel font-bold">DM Tools</h2>
        <Badge variant="outline" className="border-brass/30 text-brass">
          {tools.length} Tools
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card key={tool.name} className="bg-card/50 border-brass/20 hover:border-arcanePurple/40 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-arcanePurple/10 flex items-center justify-center shrink-0">
                  <tool.icon className="w-5 h-5 text-arcanePurple" />
                </div>
                <div>
                  <h3 className="font-cinzel font-semibold text-sm">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                  <Badge variant="outline" className="text-xs mt-2">{tool.tag}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
