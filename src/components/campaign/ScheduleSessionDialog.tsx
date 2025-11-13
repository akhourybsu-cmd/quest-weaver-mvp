import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

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
        .insert({
          campaign_id: campaignId,
          status: "scheduled",
          started_at: scheduledDateTime.toISOString(),
          session_notes: description || null,
        });

      if (error) throw error;

      toast.success("Session scheduled successfully");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setDate(undefined);
      setTime("18:00");
      setSessionName("");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cinzel">Schedule Session</DialogTitle>
          <DialogDescription>
            Plan your next session and set up the session pack
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
