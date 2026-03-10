import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoTimeline } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, Swords, Scroll, Users, Crown, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface DemoTimelineTabProps {
  campaign: DemoCampaign;
}

const eventTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  combat: { label: "Combat", icon: <Swords className="w-4 h-4" />, color: "bg-red-500/10 text-red-400 border-red-500/30" },
  quest: { label: "Quest", icon: <Scroll className="w-4 h-4" />, color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  social: { label: "Social", icon: <Users className="w-4 h-4" />, color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  political: { label: "Political", icon: <Crown className="w-4 h-4" />, color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
};

export function DemoTimelineTab({ campaign }: DemoTimelineTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const timeline = adaptDemoTimeline(campaign);
  const sortedTimeline = [...timeline].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  const [selected, setSelected] = useState<typeof timeline[0] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ title: "", description: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", type: "quest" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSelect = (event: typeof timeline[0]) => {
    setSelected(event);
    setEditFields({ title: event.title, description: event.description });
    setEditMode(false);
  };

  const handleSave = () => {
    if (!selected) return;
    updateEntity("timeline", selected.id, editFields);
    setEditMode(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteEntity("timeline", selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const handleAdd = () => {
    if (!newEvent.title.trim()) return;
    addEntity("timeline", {
      date: new Date().toISOString(),
      title: newEvent.title,
      description: newEvent.description,
      type: newEvent.type,
    });
    setNewEvent({ title: "", description: "", type: "quest" });
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-brass" />
          <h2 className="text-xl font-cinzel text-brass">Campaign Timeline</h2>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
      </div>

      {sortedTimeline.length === 0 ? (
        <Card className="border-brass/20"><CardContent className="py-8 text-center text-muted-foreground">No timeline events recorded</CardContent></Card>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-brass/20" />
          <div className="space-y-4">
            {sortedTimeline.map((event) => {
              const config = eventTypeConfig[event.event_type] || eventTypeConfig.quest;
              return (
                <div key={event.id} className="relative pl-12 cursor-pointer" onClick={() => handleSelect(event)}>
                  <div className="absolute left-2 top-4 w-4 h-4 rounded-full bg-brass/30 border-2 border-brass flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-brass" />
                  </div>
                  <Card className="border-brass/20 hover:border-brass/40 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={config.color}>{config.icon}<span className="ml-1">{config.label}</span></Badge>
                            {event.session_number && <Badge variant="secondary" className="text-xs">Session {event.session_number}</Badge>}
                          </div>
                          <h3 className="font-cinzel font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">{format(new Date(event.event_date), "MMM d, yyyy")}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setEditMode(false); }}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel">
                  {editMode ? <Input value={editFields.title} onChange={(e) => setEditFields(f => ({ ...f, title: e.target.value }))} /> : selected.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {editMode ? (
                  <Textarea value={editFields.description} onChange={(e) => setEditFields(f => ({ ...f, description: e.target.value }))} rows={4} />
                ) : (
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                )}
              </div>
              <DialogFooter className="gap-2">
                {editMode ? (
                  <><Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>
                ) : (
                  <><Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button><Button variant="outline" size="sm" onClick={() => setEditMode(true)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button></>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-cinzel">New Timeline Event</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Event title..." value={newEvent.title} onChange={(e) => setNewEvent(n => ({ ...n, title: e.target.value }))} />
            <Select value={newEvent.type} onValueChange={(v) => setNewEvent(n => ({ ...n, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(eventTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Description..." value={newEvent.description} onChange={(e) => setNewEvent(n => ({ ...n, description: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newEvent.title.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Event</AlertDialogTitle><AlertDialogDescription>Delete "{selected?.title}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
