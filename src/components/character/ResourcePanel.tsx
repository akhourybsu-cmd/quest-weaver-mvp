import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, Plus, Minus, RotateCcw } from "lucide-react";
import { useCharacterResources } from "@/hooks/useCharacterResources";
import { Skeleton } from "@/components/ui/skeleton";

interface ResourcePanelProps {
  characterId: string;
  canEdit?: boolean;
}

export const ResourcePanel = ({ characterId, canEdit = false }: ResourcePanelProps) => {
  const { resources, loading, updateResource, restoreResources } = useCharacterResources(characterId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (resources.length === 0) {
    return null;
  }

  const handleResourceChange = (resourceId: string, currentValue: number, maxValue: number, delta: number) => {
    const newValue = Math.max(0, Math.min(maxValue, currentValue + delta));
    if (newValue !== currentValue) {
      updateResource(resourceId, newValue);
    }
  };

  const shortRestResources = resources.filter(r => r.recharge === 'short');
  const longRestResources = resources.filter(r => r.recharge === 'long');
  const needsShortRest = shortRestResources.some(r => r.current_value < r.max_value);
  const needsLongRest = longRestResources.some(r => r.current_value < r.max_value);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Resources
          </CardTitle>
          {canEdit && (needsShortRest || needsLongRest) && (
            <div className="flex gap-1">
              {needsShortRest && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => restoreResources('short')}
                  className="h-7 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Short Rest
                </Button>
              )}
              {needsLongRest && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => restoreResources('long')}
                  className="h-7 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Long Rest
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {resources.map((resource) => {
          const percentage = (resource.current_value / resource.max_value) * 100;
          const isLow = percentage < 50;
          const isDepleted = percentage === 0;

          return (
            <div key={resource.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{resource.label}</span>
                  <Badge 
                    variant={resource.recharge === 'short' ? 'secondary' : 'outline'} 
                    className="text-xs"
                  >
                    {resource.recharge === 'short' ? 'Short' : 'Long'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleResourceChange(resource.id, resource.current_value, resource.max_value, -1)}
                        disabled={resource.current_value <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleResourceChange(resource.id, resource.current_value, resource.max_value, 1)}
                        disabled={resource.current_value >= resource.max_value}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <span className={`text-sm font-mono ${isDepleted ? 'text-destructive' : isLow ? 'text-yellow-600 dark:text-yellow-500' : ''}`}>
                    {resource.current_value}/{resource.max_value}
                  </span>
                </div>
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
