import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Flame, Zap, Shield } from "lucide-react";
import SpellCastDialog from "./SpellCastDialog";

interface SpellCardProps {
  spell: {
    id: string;
    name: string;
    level: number;
    school: string;
    casting_time: string;
    range: string;
    duration: string;
    components: any;
    concentration?: boolean;
    ritual?: boolean;
    description: string;
    damage?: string;
    healing?: string;
    scaling_type?: string;
    scaling_value?: string;
    scaling_description?: string;
  };
  characterId?: string;
  onCast?: (slotLevel: number, scalingInfo?: string) => void;
  canCast?: boolean;
  showCastButton?: boolean;
}

const SpellCard = ({
  spell,
  characterId,
  onCast,
  canCast = false,
  showCastButton = false,
}: SpellCardProps) => {
  const getSchoolIcon = (school: string) => {
    switch (school.toLowerCase()) {
      case 'evocation': return <Flame className="w-4 h-4" />;
      case 'abjuration': return <Shield className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const hasScaling = spell.scaling_type && spell.scaling_type !== 'none' && spell.level > 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {getSchoolIcon(spell.school)}
              {spell.name}
            </CardTitle>
            <CardDescription className="mt-1">
              <div className="flex gap-2 flex-wrap">
                {spell.level === 0 ? (
                  <Badge variant="secondary">Cantrip</Badge>
                ) : (
                  <Badge variant="default">Level {spell.level}</Badge>
                )}
                <Badge variant="outline">{spell.school}</Badge>
                {spell.concentration && <Badge variant="destructive">Concentration</Badge>}
                {spell.ritual && <Badge variant="secondary">Ritual</Badge>}
              </div>
            </CardDescription>
          </div>
          {showCastButton && canCast && characterId && onCast && (
            <SpellCastDialog
              characterId={characterId}
              spell={spell}
              onCast={onCast}
            >
              <Button size="sm">
                <Zap className="w-4 h-4 mr-1" />
                Cast
              </Button>
            </SpellCastDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Casting Time:</span>
            <div className="font-medium">{spell.casting_time}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Range:</span>
            <div className="font-medium">{spell.range}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <div className="font-medium">{spell.duration}</div>
          </div>
        </div>

        {spell.components && (
          <div className="text-sm">
            <span className="text-muted-foreground">Components: </span>
            <span className="font-medium">
              {[
                spell.components.verbal && 'V',
                spell.components.somatic && 'S',
                spell.components.material && 'M'
              ].filter(Boolean).join(', ')}
            </span>
            {spell.components.material_description && (
              <div className="text-xs text-muted-foreground mt-1">
                {spell.components.material_description}
              </div>
            )}
          </div>
        )}

        <div className="text-sm">
          <p>{spell.description}</p>
        </div>

        {hasScaling && (
          <div className="bg-primary/10 p-2 rounded text-sm">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 mt-0.5 text-primary" />
              <div>
                <div className="font-semibold text-primary">At Higher Levels</div>
                <div className="text-muted-foreground text-xs">
                  {spell.scaling_description || `+${spell.scaling_value} per slot level`}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpellCard;
