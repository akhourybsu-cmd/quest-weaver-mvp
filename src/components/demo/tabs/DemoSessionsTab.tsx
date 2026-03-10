import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoSessions } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Clock, FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface DemoSessionsTabProps {
  campaign: DemoCampaign;
}

export function DemoSessionsTab({ campaign }: DemoSessionsTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const sessions = adaptDemoSessions(campaign);
  const upcomingSessions = sessions.filter(s => s.status === "scheduled");
  const pastSessions = sessions.filter(s => s.status === "ended");
  const [selected, setSelected] = useState<typeof sessions[0] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ title: "", notes: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [newSession, setNewSession] = useState({ title: "", location: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSelect = (session: typeof sessions[0]) => {
    setSelected(session);
    setEditFields({ title: session.title, notes: session.notes || "" });
    setEditMode(false);
  };

  const handleSave = () => {
    if (!selected) return;
    // Update raw session
    const raw = campaign.sessions.find(s => s.id === selected.id);
    if (raw) updateEntity("sessions", selected.id, { title: editFields.title, notes: editFields.notes });
    setEditMode(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteEntity("sessions", selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const handleAdd = () => {
    if (!newSession.title.trim()) return;
    const nextNum = campaign.sessions.length + 1;
    addEntity("sessions", {
      title: newSession.title,
      session_number: nextNum,
      date: new Date(Date.now() + 7 * 86400000).toISOString(),
      location: newSession.location || "TBD",
      status: "upcoming",
    });
    setNewSession({ title: "", location: "" });
    setAddOpen(false);
  };

  const SessionCard = ({ session, upcoming }: { session: typeof sessions[0]; upcoming?: boolean }) => (
    <Card className="border-brass/20 hover:border-brass/40 transition-colors cursor-pointer" onClick={() => handleSelect(session)}>
      {upcoming ? (
        <>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg font-cinzel">{session.title}</CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Upcoming</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" /><span>{format(new Date(session.started_at), "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" /><span>{session.location}</span>
            </div>
          </CardContent>
        </>
      ) : (
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-cinzel font-semibold">{session.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(session.started_at), "MMM d, yyyy")}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>
              </div>
              {session.notes && <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>}
            </div>
            <Badge variant="secondary">Completed</Badge>
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Session</Button>
      </div>

      <section>
        <h2 className="text-xl font-cinzel text-brass mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <Card className="border-brass/20"><CardContent className="py-8 text-center text-muted-foreground">No upcoming sessions</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{upcomingSessions.map(s => <SessionCard key={s.id} session={s} upcoming />)}</div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-cinzel text-brass mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Past Sessions</h2>
        {pastSessions.length === 0 ? (
          <Card className="border-brass/20"><CardContent className="py-8 text-center text-muted-foreground">No past sessions</CardContent></Card>
        ) : (
          <div className="space-y-3">{pastSessions.map(s => <SessionCard key={s.id} session={s} />)}</div>
        )}
      </section>

      {/* Detail / Edit */}
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
                  <Textarea value={editFields.notes} onChange={(e) => setEditFields(f => ({ ...f, notes: e.target.value }))} rows={4} placeholder="Session notes..." />
                ) : (
                  <p className="text-sm text-muted-foreground">{selected.notes || "No notes yet."}</p>
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
          <DialogHeader><DialogTitle className="font-cinzel">New Session</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Session title..." value={newSession.title} onChange={(e) => setNewSession(n => ({ ...n, title: e.target.value }))} />
            <Input placeholder="Location..." value={newSession.location} onChange={(e) => setNewSession(n => ({ ...n, location: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newSession.title.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Session</AlertDialogTitle><AlertDialogDescription>Delete "{selected?.title}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
