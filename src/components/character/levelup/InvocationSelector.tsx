import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, AlertCircle } from "lucide-react";
import { ELDRITCH_INVOCATIONS, filterInvocationsByPrerequisites } from "@/lib/rules/levelUpRules";

interface InvocationSelectorProps {
  warlockLevel: number;
  pactBoon: string | null;
  knownCantrips: string[];
  currentInvocations: string[];
  selectedNewInvocations: string[];
  invocationsToRemove: string[];
  onNewInvocationToggle: (invocationId: string) => void;
  onRemoveInvocationToggle: (invocationId: string) => void;
  newCount: number;
  replaceCount: number;
}

export const InvocationSelector = ({
  warlockLevel,
  pactBoon,
  knownCantrips,
  currentInvocations,
  selectedNewInvocations,
  invocationsToRemove,
  onNewInvocationToggle,
  onRemoveInvocationToggle,
  newCount,
  replaceCount,
}: InvocationSelectorProps) => {
  // Filter invocations by prerequisites
  const eligibleInvocations = useMemo(() => {
    return filterInvocationsByPrerequisites(
      ELDRITCH_INVOCATIONS,
      warlockLevel,
      pactBoon,
      knownCantrips
    );
  }, [warlockLevel, pactBoon, knownCantrips]);

  // Invocations available to learn (not already known)
  const availableToLearn = useMemo(() => {
    return eligibleInvocations.filter(inv => !currentInvocations.includes(inv.id));
  }, [eligibleInvocations, currentInvocations]);

  // Current invocations that can be replaced
  const currentInvocationDetails = useMemo(() => {
    return ELDRITCH_INVOCATIONS.filter(inv => currentInvocations.includes(inv.id));
  }, [currentInvocations]);

  const getPrerequisiteText = (inv: typeof ELDRITCH_INVOCATIONS[0]) => {
    if (!inv.prerequisite) return null;
    const prereq = inv.prerequisite as any;
    const parts: string[] = [];
    if (prereq.level) parts.push(`Level ${prereq.level}+`);
    if (prereq.pactBoon) parts.push(prereq.pactBoon);
    if (prereq.cantripRequired) parts.push(prereq.cantripRequired);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const totalNewSelections = selectedNewInvocations.length;
  const totalAllowedNew = newCount + invocationsToRemove.length;

  return (
    <div className="space-y-6">
      {/* New Invocations */}
      <Card className="border-primary/20 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Learn New Invocations
          </CardTitle>
          <CardDescription>
            Choose {newCount} new invocation{newCount > 1 ? 's' : ''}.
            {replaceCount > 0 && ` You may also replace up to ${replaceCount} existing invocation${replaceCount > 1 ? 's' : ''}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
            <span className="text-sm font-medium">New Invocations Selected</span>
            <Badge variant={totalNewSelections >= newCount ? "default" : "secondary"}>
              {totalNewSelections} / {totalAllowedNew}
            </Badge>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {availableToLearn.map(inv => {
                const isSelected = selectedNewInvocations.includes(inv.id);
                const isDisabled = !isSelected && totalNewSelections >= totalAllowedNew;
                const prereqText = getPrerequisiteText(inv);

                return (
                  <div
                    key={inv.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/20 border-primary/40"
                        : isDisabled
                          ? "opacity-50 cursor-not-allowed border-border"
                          : "hover:bg-muted/50 border-border"
                    }`}
                    onClick={() => !isDisabled && onNewInvocationToggle(inv.id)}
                  >
                    <Checkbox checked={isSelected} disabled={isDisabled} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{inv.name}</span>
                        {prereqText && (
                          <Badge variant="outline" className="text-xs">
                            {prereqText}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{inv.description}</p>
                    </div>
                  </div>
                );
              })}

              {availableToLearn.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No invocations available that meet your prerequisites.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Replace Invocations (if applicable) */}
      {replaceCount > 0 && currentInvocationDetails.length > 0 && (
        <Card className="border-amber-500/20 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <Eye className="h-5 w-5" />
              Replace Existing Invocations (Optional)
            </CardTitle>
            <CardDescription>
              You may replace up to {replaceCount} invocation{replaceCount > 1 ? 's' : ''} with new ones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
              <span className="text-sm font-medium">Invocations to Replace</span>
              <Badge variant="secondary">
                {invocationsToRemove.length} / {replaceCount}
              </Badge>
            </div>

            <div className="space-y-2">
              {currentInvocationDetails.map(inv => {
                const isSelected = invocationsToRemove.includes(inv.id);
                const isDisabled = !isSelected && invocationsToRemove.length >= replaceCount;

                return (
                  <div
                    key={inv.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/40"
                        : isDisabled
                          ? "opacity-50 cursor-not-allowed border-border"
                          : "hover:bg-muted/50 border-border"
                    }`}
                    onClick={() => !isDisabled && onRemoveInvocationToggle(inv.id)}
                  >
                    <Checkbox checked={isSelected} disabled={isDisabled} className="mt-1" />
                    <div className="flex-1">
                      <span className="font-medium">{inv.name}</span>
                      <p className="text-sm text-muted-foreground mt-1">{inv.description}</p>
                    </div>
                    {isSelected && (
                      <Badge variant="destructive" className="text-xs">
                        Replacing
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
