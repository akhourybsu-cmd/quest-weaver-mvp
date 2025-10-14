import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, X } from "lucide-react";

const CONDITIONS = [
  { value: "blinded", label: "Blinded", color: "bg-gray-500" },
  { value: "charmed", label: "Charmed", color: "bg-pink-500" },
  { value: "deafened", label: "Deafened", color: "bg-gray-400" },
  { value: "frightened", label: "Frightened", color: "bg-purple-500" },
  { value: "grappled", label: "Grappled", color: "bg-orange-500" },
  { value: "incapacitated", label: "Incapacitated", color: "bg-red-600" },
  { value: "invisible", label: "Invisible", color: "bg-blue-300" },
  { value: "paralyzed", label: "Paralyzed", color: "bg-red-500" },
  { value: "petrified", label: "Petrified", color: "bg-gray-600" },
  { value: "poisoned", label: "Poisoned", color: "bg-green-500" },
  { value: "prone", label: "Prone", color: "bg-yellow-600" },
  { value: "restrained", label: "Restrained", color: "bg-orange-600" },
  { value: "stunned", label: "Stunned", color: "bg-yellow-500" },
  { value: "unconscious", label: "Unconscious", color: "bg-gray-700" },
  { value: "exhaustion_1", label: "Exhaustion 1", color: "bg-amber-400" },
  { value: "exhaustion_2", label: "Exhaustion 2", color: "bg-amber-500" },
  { value: "exhaustion_3", label: "Exhaustion 3", color: "bg-amber-600" },
  { value: "exhaustion_4", label: "Exhaustion 4", color: "bg-amber-700" },
  { value: "exhaustion_5", label: "Exhaustion 5", color: "bg-amber-800" },
  { value: "exhaustion_6", label: "Exhaustion 6", color: "bg-red-900" },
];

interface Condition {
  id: string;
  character_id: string;
  condition: string;
  ends_at_round: number | null;
  character?: { name: string };
}

interface ConditionsManagerProps {
  encounterId: string;
  currentRound: number;
  characters: Array<{ id: string; name: string }>;
}

const ConditionsManager = ({ encounterId, currentRound, characters }: ConditionsManagerProps) => {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [duration, setDuration] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchConditions();

    const channel = supabase
      .channel(`conditions:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_conditions',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchConditions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId]);

  const fetchConditions = async () => {
    const { data, error } = await supabase
      .from("character_conditions")
      .select(`
        *,
        character:characters(name)
      `)
      .eq("encounter_id", encounterId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching conditions:", error);
      return;
    }

    setConditions(data || []);
  };

  const addCondition = async () => {
    if (!selectedCharacter || !selectedCondition) return;

    const endsAtRound = duration ? currentRound + parseInt(duration, 10) : null;

    const { error } = await supabase.from("character_conditions").insert({
      character_id: selectedCharacter,
      condition: selectedCondition as any,
      encounter_id: encounterId,
      ends_at_round: endsAtRound,
    });

    if (error) {
      toast({
        title: "Error adding condition",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Condition added",
    });

    setSelectedCharacter("");
    setSelectedCondition("");
    setDuration("");
    setOpen(false);
  };

  const removeCondition = async (conditionId: string) => {
    const { error } = await supabase
      .from("character_conditions")
      .delete()
      .eq("id", conditionId);

    if (error) {
      toast({
        title: "Error removing condition",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Condition removed",
    });
  };

  const getConditionColor = (condition: string) => {
    return CONDITIONS.find(c => c.value === condition)?.color || "bg-gray-500";
  };

  const getConditionLabel = (condition: string) => {
    return CONDITIONS.find(c => c.value === condition)?.label || condition;
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Conditions
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Add Condition</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Condition</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Character</Label>
                <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select character" />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map((char) => (
                      <SelectItem key={char.id} value={char.id}>
                        {char.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${condition.color}`} />
                          {condition.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration (rounds)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Leave empty for indefinite"
                  min="1"
                  max="100"
                />
              </div>

              <Button onClick={addCondition} className="w-full">
                Add Condition
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pb-3">
        {conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active conditions
          </p>
        ) : (
          <div className="space-y-2">
            {conditions.map((condition) => (
              <div
                key={condition.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Badge className={getConditionColor(condition.condition)}>
                    {getConditionLabel(condition.condition)}
                  </Badge>
                  <span className="text-sm font-medium">{condition.character?.name}</span>
                  {condition.ends_at_round && (
                    <span className="text-xs text-muted-foreground">
                      ({condition.ends_at_round - currentRound} rounds left)
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(condition.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConditionsManager;