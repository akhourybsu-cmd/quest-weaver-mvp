import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoMonsters } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Flame, Heart, Shield, Plus, Pencil, Trash2 } from "lucide-react";

interface DemoBestiaryTabProps {
  campaign: DemoCampaign;
}

export function DemoBestiaryTab({ campaign }: DemoBestiaryTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const monsters = adaptDemoMonsters(campaign);
  const [selected, setSelected] = useState<typeof monsters[0] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ name: "", hp_avg: 0, ac: 0 });
  const [addOpen, setAddOpen] = useState(false);
  const [newMonster, setNewMonster] = useState({ name: "", cr: "1", type: "Beast", hp: "10", ac: "12" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const getCRColor = (cr: string) => {
    const crNum = parseFloat(cr);
    if (crNum >= 10) return "border-dragonRed/50 text-dragonRed";
    if (crNum >= 5) return "border-orange-500/50 text-orange-500";
    return "border-green-500/50 text-green-500";
  };

  const handleSelect = (monster: typeof monsters[0]) => {
    setSelected(monster);
    setEditFields({ name: monster.name, hp_avg: monster.hp_avg || 0, ac: monster.ac || 0 });
    setEditMode(false);
  };

  const handleSave = () => {
    if (!selected) return;
    updateEntity("monsters", selected.id, { name: editFields.name, hp: editFields.hp_avg, ac: editFields.ac });
    setEditMode(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteEntity("monsters", selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const handleAdd = () => {
    if (!newMonster.name.trim()) return;
    addEntity("monsters", {
      name: newMonster.name,
      cr: parseFloat(newMonster.cr) || 1,
      type: newMonster.type,
      size: "Medium",
      hp: parseInt(newMonster.hp) || 10,
      ac: parseInt(newMonster.ac) || 12,
      environment: "any",
      traits: [],
    });
    setNewMonster({ name: "", cr: "1", type: "Beast", hp: "10", ac: "12" });
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold">Bestiary</h2>
          <p className="text-muted-foreground">Creatures encountered in your campaign</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Creature</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {monsters.map((monster) => (
          <Card key={monster.id} className="bg-card/50 border-brass/20 hover:shadow-lg transition-all cursor-pointer" onClick={() => handleSelect(monster)}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="font-cinzel flex items-center gap-2"><Flame className="w-5 h-5 text-arcanePurple" />{monster.name}</CardTitle>
                  <CardDescription className="mt-1">{monster.type} • {monster.size}</CardDescription>
                </div>
                {monster.cr && <Badge variant="outline" className={getCRColor(monster.cr.toString())}>CR {monster.cr}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-dragonRed" /><span>{monster.hp_avg || "?"} HP</span></div>
                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-brass" /><span>AC {monster.ac || "?"}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm text-muted-foreground">HP</label><Input type="number" value={editFields.hp_avg} onChange={(e) => setEditFields(f => ({ ...f, hp_avg: parseInt(e.target.value) || 0 }))} /></div>
                    <div><label className="text-sm text-muted-foreground">AC</label><Input type="number" value={editFields.ac} onChange={(e) => setEditFields(f => ({ ...f, ac: parseInt(e.target.value) || 0 }))} /></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-dragonRed" />{selected.hp_avg} HP</div>
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-brass" />AC {selected.ac}</div>
                  </div>
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
          <DialogHeader><DialogTitle className="font-cinzel">New Creature</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name..." value={newMonster.name} onChange={(e) => setNewMonster(n => ({ ...n, name: e.target.value }))} />
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-sm text-muted-foreground">CR</label><Input value={newMonster.cr} onChange={(e) => setNewMonster(n => ({ ...n, cr: e.target.value }))} /></div>
              <div><label className="text-sm text-muted-foreground">HP</label><Input value={newMonster.hp} onChange={(e) => setNewMonster(n => ({ ...n, hp: e.target.value }))} /></div>
              <div><label className="text-sm text-muted-foreground">AC</label><Input value={newMonster.ac} onChange={(e) => setNewMonster(n => ({ ...n, ac: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newMonster.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Creature</AlertDialogTitle><AlertDialogDescription>Delete "{selected?.name}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
