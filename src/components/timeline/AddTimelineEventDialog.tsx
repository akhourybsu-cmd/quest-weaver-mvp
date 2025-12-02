import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { logTimelineEvent, TimelineEventKind } from "@/hooks/useTimelineLogger";
import { toast } from "sonner";

interface AddTimelineEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  sessionId?: string | null;
  onEventAdded?: () => void;
}

const eventKindOptions: { value: TimelineEventKind; label: string }[] = [
  { value: 'highlight', label: 'Highlight / Memorable Moment' },
  { value: 'custom', label: 'Custom Event' },
  { value: 'quest_created', label: 'Quest Started' },
  { value: 'quest_completed', label: 'Quest Completed' },
  { value: 'npc_appearance', label: 'NPC Encounter' },
  { value: 'location_discovered', label: 'Location Discovered' },
  { value: 'item_gained', label: 'Item Acquired' },
  { value: 'encounter_start', label: 'Combat Initiated' },
  { value: 'encounter_end', label: 'Combat Resolved' },
];

export function AddTimelineEventDialog({ 
  open, 
  onOpenChange, 
  campaignId, 
  sessionId,
  onEventAdded 
}: AddTimelineEventDialogProps) {
  const [kind, setKind] = useState<TimelineEventKind>('highlight');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [inGameDate, setInGameDate] = useState('');
  const [playerVisible, setPlayerVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    
    const result = await logTimelineEvent({
      campaignId,
      sessionId,
      kind,
      title: title.trim(),
      summary: summary.trim() || undefined,
      inGameDate: inGameDate.trim() || undefined,
      playerVisible,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Event added to timeline');
      resetForm();
      onOpenChange(false);
      onEventAdded?.();
    } else {
      toast.error('Failed to add event');
    }
  };

  const resetForm = () => {
    setKind('highlight');
    setTitle('');
    setSummary('');
    setInGameDate('');
    setPlayerVisible(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card" variant="ornaments">
        <DialogHeader>
          <DialogTitle className="font-cinzel flex items-center gap-2">
            <Plus className="w-5 h-5 text-brass" />
            Add Timeline Event
          </DialogTitle>
          <DialogDescription>
            Record a memorable moment or important event in your campaign history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kind">Event Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as TimelineEventKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventKindOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What happened?"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Description</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Add more details about this event..."
              className="bg-background/50 min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inGameDate">In-Game Date (optional)</Label>
            <Input
              id="inGameDate"
              value={inGameDate}
              onChange={(e) => setInGameDate(e.target.value)}
              placeholder="e.g., Day 47, Month of Storms"
              className="bg-background/50"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="playerVisible" className="text-sm">
              Visible to Players
            </Label>
            <Switch
              id="playerVisible"
              checked={playerVisible}
              onCheckedChange={setPlayerVisible}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
