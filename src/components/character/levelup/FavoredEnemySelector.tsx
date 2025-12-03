import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target } from "lucide-react";

interface FavoredEnemySelectorProps {
  currentFavoredEnemies: string[];
  selectedEnemy: string | null;
  onSelectionChange: (enemy: string) => void;
}

// Favored Enemy types per SRD
export const FAVORED_ENEMY_TYPES = [
  { 
    id: 'aberrations', 
    name: 'Aberrations', 
    description: 'Utterly alien beings with bizarre anatomy, strange abilities, and twisted minds.',
    examples: 'Beholders, Mind Flayers, Aboleths'
  },
  { 
    id: 'beasts', 
    name: 'Beasts', 
    description: 'Nonhumanoid creatures that are a natural part of the ecology.',
    examples: 'Bears, Wolves, Giant Eagles'
  },
  { 
    id: 'celestials', 
    name: 'Celestials', 
    description: 'Creatures native to the Upper Planes that are generally good-aligned.',
    examples: 'Angels, Couatls, Pegasi'
  },
  { 
    id: 'constructs', 
    name: 'Constructs', 
    description: 'Made, not born, by magical or technological means.',
    examples: 'Golems, Animated Objects, Shield Guardians'
  },
  { 
    id: 'dragons', 
    name: 'Dragons', 
    description: 'Large reptilian creatures of ancient origin and tremendous power.',
    examples: 'Chromatic Dragons, Metallic Dragons, Dragon Turtles'
  },
  { 
    id: 'elementals', 
    name: 'Elementals', 
    description: 'Creatures native to the elemental planes.',
    examples: 'Fire Elementals, Djinni, Salamanders'
  },
  { 
    id: 'fey', 
    name: 'Fey', 
    description: 'Magical creatures closely tied to the forces of nature.',
    examples: 'Dryads, Satyrs, Sprites'
  },
  { 
    id: 'fiends', 
    name: 'Fiends', 
    description: 'Wicked creatures native to the Lower Planes.',
    examples: 'Demons, Devils, Yugoloths'
  },
  { 
    id: 'giants', 
    name: 'Giants', 
    description: 'Humanoid creatures of great stature.',
    examples: 'Hill Giants, Frost Giants, Ogres'
  },
  { 
    id: 'monstrosities', 
    name: 'Monstrosities', 
    description: 'Frightening creatures that are not ordinary or natural.',
    examples: 'Owlbears, Displacer Beasts, Manticores'
  },
  { 
    id: 'oozes', 
    name: 'Oozes', 
    description: 'Gelatinous creatures that rarely have a fixed shape.',
    examples: 'Gelatinous Cubes, Black Puddings, Gray Oozes'
  },
  { 
    id: 'plants', 
    name: 'Plants', 
    description: 'Vegetable creatures, not ordinary plants.',
    examples: 'Treants, Shambling Mounds, Blights'
  },
  { 
    id: 'undead', 
    name: 'Undead', 
    description: 'Once-living creatures brought to a horrifying state of undeath.',
    examples: 'Zombies, Vampires, Liches'
  },
  { 
    id: 'humanoids_two', 
    name: 'Two Humanoid Races', 
    description: 'Choose two races of humanoid (such as gnolls and orcs).',
    examples: 'Gnolls, Orcs, Goblins, Kobolds, etc.'
  },
];

export const FavoredEnemySelector = ({
  currentFavoredEnemies,
  selectedEnemy,
  onSelectionChange,
}: FavoredEnemySelectorProps) => {
  // Filter out already chosen enemies (for additional favored enemy selections)
  const availableEnemies = FAVORED_ENEMY_TYPES.filter(
    e => !currentFavoredEnemies.includes(e.id)
  );

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Favored Enemy
        </CardTitle>
        <CardDescription>
          Choose a type of favored enemy. You have advantage on Survival checks to track 
          these creatures and Intelligence checks to recall information about them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentFavoredEnemies.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground mb-2">Current Favored Enemies:</p>
            <div className="flex flex-wrap gap-2">
              {currentFavoredEnemies.map(e => {
                const enemy = FAVORED_ENEMY_TYPES.find(t => t.id === e);
                return (
                  <Badge key={e} variant="secondary">
                    {enemy?.name || e}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          <RadioGroup 
            value={selectedEnemy || ""} 
            onValueChange={onSelectionChange}
          >
            <div className="space-y-2">
              {availableEnemies.map(enemy => (
                <div
                  key={enemy.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedEnemy === enemy.id
                      ? "bg-primary/20 border-primary/40"
                      : "hover:bg-muted/50 border-border"
                  }`}
                  onClick={() => onSelectionChange(enemy.id)}
                >
                  <RadioGroupItem value={enemy.id} id={enemy.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={enemy.id} className="font-medium cursor-pointer">
                      {enemy.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {enemy.description}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 italic">
                      Examples: {enemy.examples}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
