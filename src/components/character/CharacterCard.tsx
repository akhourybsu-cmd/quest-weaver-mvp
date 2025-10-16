import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, User } from "lucide-react";

interface CharacterCardProps {
  character: any;
  campaignId: string;
}

const CharacterCard = ({ character, campaignId }: CharacterCardProps) => {
  const navigate = useNavigate();
  const hpPercent = (character.current_hp / character.max_hp) * 100;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/campaign/${campaignId}/character/${character.id}`)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{character.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Level {character.level} {character.class}
            </p>
          </div>
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">HP</span>
                <span className="font-bold">{character.current_hp}/{character.max_hp}</span>
              </div>
              <Progress value={hpPercent} className="h-2" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">AC</div>
              <div className="text-lg font-bold">{character.ac}</div>
            </div>
          </div>
        </div>

        {character.temp_hp > 0 && (
          <div>
            <Badge variant="secondary">
              Temp HP: {character.temp_hp}
            </Badge>
          </div>
        )}

        <Button 
          className="w-full" 
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/campaign/${campaignId}/character/${character.id}`);
          }}
        >
          View Character Sheet
        </Button>
      </CardContent>
    </Card>
  );
};

export default CharacterCard;
