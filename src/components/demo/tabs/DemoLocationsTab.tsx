import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoLocations } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MapPin, Users, Flag, Plus, Pencil, Trash2 } from "lucide-react";

interface DemoLocationsTabProps {
  campaign: DemoCampaign;
}

export function DemoLocationsTab({ campaign }: DemoLocationsTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const locations = adaptDemoLocations(campaign);
  const [selected, setSelected] = useState<typeof locations[0] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ name: "", description: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: "", description: "", region: "", terrain: "urban" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const getTerrainColor = (terrain?: string) => {
    switch (terrain) {
      case "urban": return "border-blue-500/50 text-blue-500";
      case "forest": return "border-green-500/50 text-green-500";
      case "mountain": return "border-gray-500/50 text-gray-500";
      case "underground": return "border-purple-500/50 text-purple-500";
      default: return "border-brass/50 text-brass";
    }
  };

  const handleSelect = (loc: typeof locations[0]) => {
    setSelected(loc);
    setEditFields({ name: loc.name, description: loc.description || "" });
    setEditMode(false);
  };

  const handleSave = () => {
    if (!selected) return;
    updateEntity("locations", selected.id, { name: editFields.name, description: editFields.description });
    setEditMode(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteEntity("locations", selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const handleAdd = () => {
    if (!newLoc.name.trim()) return;
    addEntity("locations", {
      name: newLoc.name,
      description: newLoc.description,
      region: newLoc.region || "Unknown",
      terrain: newLoc.terrain,
      hooks: [],
      npcIds: [],
      factionIds: [],
    });
    setNewLoc({ name: "", description: "", region: "", terrain: "urban" });
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold">Locations</h2>
          <p className="text-muted-foreground">Places your party has discovered</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Location
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {locations.map((location) => (
          <Card key={location.id} className="relative overflow-hidden bg-card/50 border-brass/20 hover:shadow-lg transition-all cursor-pointer" onClick={() => handleSelect(location)}>
            {location.image_url && (
              <>
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.image_url})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-card/80 backdrop-blur-[1px]" />
              </>
            )}
            <CardHeader className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="font-cinzel flex items-center gap-2 drop-shadow-md">
                    <MapPin className="w-5 h-5 text-arcanePurple" />
                    {location.name}
                  </CardTitle>
                  {location.details?.region && <CardDescription className="mt-1">{location.details.region}</CardDescription>}
                </div>
                {location.details?.terrain && (
                  <Badge variant="outline" className={getTerrainColor(location.details.terrain)}>{location.details.terrain}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {location.description && <p className="text-sm text-muted-foreground">{location.description}</p>}
              <div className="flex flex-wrap gap-4 text-sm">
                {location.details?.npcIds?.length > 0 && <div className="flex items-center gap-2"><Users className="w-4 h-4 text-brass" /><span className="text-muted-foreground">{location.details.npcIds.length} NPCs</span></div>}
                {location.details?.factionIds?.length > 0 && <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-brass" /><span className="text-muted-foreground">{location.details.factionIds.length} Factions</span></div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail / Edit Dialog */}
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
                  <>
                    <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-cinzel">New Location</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name..." value={newLoc.name} onChange={(e) => setNewLoc(n => ({ ...n, name: e.target.value }))} />
            <Input placeholder="Region..." value={newLoc.region} onChange={(e) => setNewLoc(n => ({ ...n, region: e.target.value }))} />
            <Textarea placeholder="Description..." value={newLoc.description} onChange={(e) => setNewLoc(n => ({ ...n, description: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newLoc.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>Delete "{selected?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
