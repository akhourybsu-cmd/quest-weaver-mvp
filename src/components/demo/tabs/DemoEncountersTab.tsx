import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoEncounters, adaptDemoLocations } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Swords, MapPin, Skull, CheckCircle, Plus, Pencil, Trash2 } from "lucide-react";

interface DemoEncountersTabProps {
  campaign: DemoCampaign;
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  trivial: { label: "Trivial", color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
  easy: { label: "Easy", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  medium: { label: "Medium", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  hard: { label: "Hard", color: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  deadly: { label: "Deadly", color: "bg-red-500/10 text-red-400 border-red-500/30" },
};

export function DemoEncountersTab({ campaign }: DemoEncountersTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const encounters = adaptDemoEncounters(campaign);
  const locations = adaptDemoLocations(campaign);
  const planned = encounters.filter(e => e.status === "planned");
  const completed = encounters.filter(e => e.status === "completed");
  const [selected, setSelected] = useState<typeof encounters[0] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ name: "", description: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [newEnc, setNewEnc] = useState({ name: "", description: "", difficulty: "medium" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const getLocation = (locationId?: string) => locationId ? locations.find(l => l.id === locationId) : null;

  const handleSelect = (enc: typeof encounters[0]) => {
    setSelected(enc);
    setEditFields({ name: enc.name, description: enc.description });
    setEditMode(false);
  };

  const handleSave = () => {
    if (!selected) return;
    updateEntity("encounters", selected.id, editFields);
    setEditMode(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteEntity("encounters", selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const handleAdd = () => {
    if (!newEnc.name.trim()) return;
    addEntity("encounters", {
      name: newEnc.name,
      description: newEnc.description,
      difficulty: newEnc.difficulty as any,
      status: "planned",
      monsters: [],
    });
    setNewEnc({ name: "", description: "", difficulty: "medium" });
    setAddOpen(false);
  };

  const EncounterCard = ({ encounter }: { encounter: typeof encounters[0] }) => {
    const location = getLocation(encounter.location_id);
    const difficulty = difficultyConfig[encounter.difficulty] || difficultyConfig.medium;
    return (
      <Card className="border-brass/20 hover:border-brass/40 transition-colors cursor-pointer" onClick={() => handleSelect(encounter)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="font-cinzel">{encounter.name}</CardTitle>
            <Badge variant="outline" className={difficulty.color}>{difficulty.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{encounter.description}</p>
          {location && <div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="w-4 h-4" />{location.name}</div>}
          {encounter.monsters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {encounter.monsters.map((m, idx) => <Badge key={idx} variant="secondary" className="text-xs">{m.count}x {m.name} (CR {m.cr})</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Encounter</Button>
      </div>

      <section>
        <h2 className="text-xl font-cinzel text-brass mb-4 flex items-center gap-2"><Swords className="w-5 h-5" /> Planned ({planned.length})</h2>
        {planned.length === 0 ? (
          <Card className="border-brass/20"><CardContent className="py-8 text-center text-muted-foreground">No planned encounters</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{planned.map(e => <EncounterCard key={e.id} encounter={e} />)}</div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-cinzel text-brass mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Completed ({completed.length})</h2>
        {completed.length === 0 ? (
          <Card className="border-brass/20"><CardContent className="py-8 text-center text-muted-foreground">No completed encounters</CardContent></Card>
        ) : (
          <div className="space-y-3">{completed.map(e => <EncounterCard key={e.id} encounter={e} />)}</div>
        )}
      </section>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setEditMode(false); }}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel">
                  {editMode ? <Input value={editFields.name} onChange={(e) => setEditFields(f => ({ ...f, name: e.target.value }))} /> : selected.name}
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
          <DialogHeader><DialogTitle className="font-cinzel">New Encounter</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Encounter name..." value={newEnc.name} onChange={(e) => setNewEnc(n => ({ ...n, name: e.target.value }))} />
            <Select value={newEnc.difficulty} onValueChange={(v) => setNewEnc(n => ({ ...n, difficulty: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(difficultyConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Description..." value={newEnc.description} onChange={(e) => setNewEnc(n => ({ ...n, description: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newEnc.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Encounter</AlertDialogTitle><AlertDialogDescription>Delete "{selected?.name}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
