import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PrepChecklistItem {
  text: string;
  completed: boolean;
}

interface ScheduleSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  onSuccess?: () => void;
}

export function ScheduleSessionDialog({ open, onOpenChange, campaignId, onSuccess }: ScheduleSessionDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("18:00");
  const [sessionName, setSessionName] = useState("");
  const [goals, setGoals] = useState("");
  const [prepChecklist, setPrepChecklist] = useState<PrepChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setPrepChecklist([...prepChecklist, { text: newChecklistItem.trim(), completed: false }]);
      setNewChecklistItem("");
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setPrepChecklist(prepChecklist.filter((_, i) => i !== index));
  };

  const handleSchedule = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    setCreating(true);
    try {
      // Combine date and time
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledDateTime = new Date(date);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from("campaign_sessions")
        .insert([{
          campaign_id: campaignId,
          status: "scheduled",
          started_at: scheduledDateTime.toISOString(),
          session_notes: description || null,
          name: sessionName.trim() || null,
          goals: goals.trim() || null,
          prep_checklist: prepChecklist.length > 0 ? JSON.stringify(prepChecklist) : '[]',
        }]);

      if (error) throw error;

      toast.success("Session scheduled successfully");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setDate(undefined);
      setTime("18:00");
      setSessionName("");
      setGoals("");
      setPrepChecklist([]);
      setNewChecklistItem("");
      setDescription("");
    } catch (error: any) {
      console.error("Error scheduling session:", error);
      toast.error("Failed to schedule session");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-cinzel">Schedule Session</DialogTitle>
          <DialogDescription>
            Plan your next session and set up the session pack
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Session Name (Optional)</Label>
            <Input
              id="sessionName"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., The Dragon's Lair, Session 12"
            />
            <p className="text-xs text-muted-foreground">
              If left blank, the date will be displayed instead
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Session Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Session Goals (Optional)</Label>
            <Textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="What do you want to accomplish this session?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Prep Checklist (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Add prep item..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
              />
              <Button type="button" size="icon" variant="outline" onClick={handleAddChecklistItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {prepChecklist.length > 0 && (
              <div className="space-y-2 mt-2">
                {prepChecklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) => {
                        const updated = [...prepChecklist];
                        updated[index].completed = !!checked;
                        setPrepChecklist(updated);
                      }}
                    />
                    <span className={cn("flex-1 text-sm", item.completed && "line-through text-muted-foreground")}>
                      {item.text}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleRemoveChecklistItem(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Session Notes (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Session objectives, planned encounters, story notes..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={creating}>
            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Schedule Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
