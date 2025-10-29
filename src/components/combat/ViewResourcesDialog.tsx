import { Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculateCharacterResources, getResourceResetDescription } from "@/lib/resourceCalculator";

interface ViewResourcesDialogProps {
  className: string;
  level: number;
  characterName: string;
}

export function ViewResourcesDialog({
  className,
  level,
  characterName,
}: ViewResourcesDialogProps) {
  const resources = calculateCharacterResources(className, level);
  const hasSpellSlots = resources.spellSlots.length > 0;
  const hasClassResources = resources.classResources.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1">
          <Info className="w-4 h-4 mr-2" />
          View Resources
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {characterName}'s Resources
          </DialogTitle>
          <DialogDescription>
            Level {level} {className} • Auto-calculated from class and level
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hasSpellSlots && !hasClassResources && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                This character has no spell slots or class resources at level {level}.
              </CardContent>
            </Card>
          )}

          {/* Spell Slots Section */}
          {hasSpellSlots && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Spell Slots</h3>
                <Badge variant="outline" className="text-xs">
                  Restore on Long Rest
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {resources.spellSlots.map((slot) => (
                  <Card key={slot.level} className="bg-muted/30">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        Level {slot.level}
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {slot.total}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {slot.total === 1 ? "slot" : "slots"}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {hasSpellSlots && hasClassResources && <Separator />}

          {/* Class Resources Section */}
          {hasClassResources && (
            <div className="space-y-3">
              <h3 className="font-semibold">Class Resources</h3>
              <div className="space-y-2">
                {resources.classResources.map((resource, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium">{resource.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {getResourceResetDescription(resource.resetOn)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{resource.total}</div>
                          <div className="text-xs text-muted-foreground">
                            {resource.total === 1 ? "use" : "uses"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 text-xs text-muted-foreground">
              <strong>Note:</strong> These resources are automatically managed during combat
              and restored when you rest. Track them in real-time during sessions!
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
