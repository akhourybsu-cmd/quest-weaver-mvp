import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoFactions } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, Target, Quote, TrendingUp, TrendingDown, Plus, Pencil, Trash2 } from "lucide-react";
import { getReputationLabel, getReputationColor, getInfluenceLabel } from "@/lib/factionUtils";

interface DemoFactionsTabProps {
  campaign: DemoCampaign;
}

export function DemoFactionsTab({ campaign }: DemoFactionsTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const factions = adaptDemoFactions(campaign);
  const [selectedFaction, setSelectedFaction] = useState<ReturnType<typeof adaptDemoFactions>[0] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ name: "", description: "", reputation: 0 });
  const [addOpen, setAddOpen] = useState(false);
  const [newFaction, setNewFaction] = useState({ name: "", description: "", motto: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSelect = (faction: typeof factions[0]) => {
    setSelectedFaction(faction);
    setEditFields({ name: faction.name, description: faction.description, reputation: faction.reputation });
    setEditMode(false);
  };

  const handleSave = () => {
    if (!selectedFaction) return;
    updateEntity("factions", selectedFaction.id, editFields);
    setEditMode(false);
    setSelectedFaction(null);
  };

  const handleDelete = () => {
    if (!selectedFaction) return;
    deleteEntity("factions", selectedFaction.id);
    setDeleteOpen(false);
    setSelectedFaction(null);
  };

  const handleAdd = () => {
    if (!newFaction.name.trim()) return;
    addEntity("factions", {
      name: newFaction.name,
      description: newFaction.description,
      motto: newFaction.motto,
      influence_score: 50,
      tags: [],
      goals: [],
      reputation: 0,
    });
    setNewFaction({ name: "", description: "", motto: "" });
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brass" />
          <h2 className="text-xl font-cinzel text-brass">Factions ({factions.length})</h2>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Faction</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {factions.map(faction => (
          <Card key={faction.id} className="border-brass/20 hover:border-brass/40 transition-colors cursor-pointer overflow-hidden" onClick={() => handleSelect(faction)}>
            {faction.banner_url && (
              <div className="relative w-full h-24 overflow-hidden">
                <img src={faction.banner_url} alt={faction.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
            )}
            <CardHeader className={faction.banner_url ? "pt-2" : ""}>
              <CardTitle className="font-cinzel">{faction.name}</CardTitle>
              {faction.motto && <p className="text-xs italic text-muted-foreground flex items-center gap-1"><Quote className="w-3 h-3" /> "{faction.motto}"</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{faction.description}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Reputation</span>
                  <span className={getReputationColor(faction.reputation)}>{getReputationLabel(faction.reputation)}</span>
                </div>
                <Progress value={(faction.reputation + 100) / 2} className="h-2" />
              </div>
              <div className="flex flex-wrap gap-1">{faction.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail / Edit */}
      <Dialog open={!!selectedFaction} onOpenChange={() => { setSelectedFaction(null); setEditMode(false); }}>
        <DialogContent className="max-w-2xl">
          {selectedFaction && (
            <>
              <DialogHeader>
                {selectedFaction.banner_url && <div className="w-full h-32 rounded-lg overflow-hidden mb-4"><img src={selectedFaction.banner_url} alt={selectedFaction.name} className="w-full h-full object-cover" /></div>}
                <DialogTitle className="font-cinzel text-xl">
                  {editMode ? <Input value={editFields.name} onChange={(e) => setEditFields(f => ({ ...f, name: e.target.value }))} /> : selectedFaction.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {editMode ? (
                  <>
                    <Textarea value={editFields.description} onChange={(e) => setEditFields(f => ({ ...f, description: e.target.value }))} rows={3} />
                    <div>
                      <label className="text-sm font-semibold text-brass">Reputation: {editFields.reputation}</label>
                      <Slider value={[editFields.reputation]} onValueChange={(v) => setEditFields(f => ({ ...f, reputation: v[0] }))} min={-100} max={100} step={5} className="mt-2" />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">{selectedFaction.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-brass flex items-center gap-2">
                          {selectedFaction.reputation >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />} Reputation
                        </h4>
                        <Progress value={(selectedFaction.reputation + 100) / 2} className="h-3" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-brass">Influence</h4>
                        <Progress value={selectedFaction.influence_score} className="h-3" />
                      </div>
                    </div>
                    {selectedFaction.goals.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-brass mb-2 flex items-center gap-2"><Target className="w-4 h-4" /> Goals</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {selectedFaction.goals.map((goal, idx) => <li key={idx}>{goal}</li>)}
                        </ul>
                      </div>
                    )}
                  </>
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
          <DialogHeader><DialogTitle className="font-cinzel">New Faction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Faction name..." value={newFaction.name} onChange={(e) => setNewFaction(n => ({ ...n, name: e.target.value }))} />
            <Input placeholder="Motto..." value={newFaction.motto} onChange={(e) => setNewFaction(n => ({ ...n, motto: e.target.value }))} />
            <Textarea placeholder="Description..." value={newFaction.description} onChange={(e) => setNewFaction(n => ({ ...n, description: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newFaction.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Faction</AlertDialogTitle><AlertDialogDescription>Delete "{selectedFaction?.name}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
