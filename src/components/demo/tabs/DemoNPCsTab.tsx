import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoNPCs, adaptDemoLocations, adaptDemoFactions } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, MapPin, Users, Heart, Skull, Meh, Plus, Pencil, Trash2 } from "lucide-react";

interface DemoNPCsTabProps {
  campaign: DemoCampaign;
}

export function DemoNPCsTab({ campaign }: DemoNPCsTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const [search, setSearch] = useState("");
  const [selectedNPC, setSelectedNPC] = useState<ReturnType<typeof adaptDemoNPCs>[0] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ name: "", role_title: "", public_bio: "", gm_notes: "", secrets: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [newNPC, setNewNPC] = useState({ name: "", role_title: "", public_bio: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const npcs = adaptDemoNPCs(campaign);
  const locations = adaptDemoLocations(campaign);
  const factions = adaptDemoFactions(campaign);

  const filteredNPCs = npcs.filter(npc =>
    npc.name.toLowerCase().includes(search.toLowerCase()) ||
    npc.role_title.toLowerCase().includes(search.toLowerCase()) ||
    npc.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const getDispositionIcon = (disposition: number) => {
    if (disposition >= 50) return <Heart className="w-4 h-4 text-emerald-400" />;
    if (disposition <= -50) return <Skull className="w-4 h-4 text-red-400" />;
    return <Meh className="w-4 h-4 text-amber-400" />;
  };

  const getDispositionLabel = (disposition: number) => {
    if (disposition >= 75) return "Friendly";
    if (disposition >= 25) return "Warm";
    if (disposition >= -25) return "Neutral";
    if (disposition >= -75) return "Hostile";
    return "Enemy";
  };

  const getLocation = (locationId: string) => locations.find(l => l.id === locationId);
  const getFaction = (factionId?: string) => factionId ? factions.find(f => f.id === factionId) : null;

  const handleSelectNPC = (npc: typeof npcs[0]) => {
    setSelectedNPC(npc);
    setEditFields({ name: npc.name, role_title: npc.role_title, public_bio: npc.public_bio, gm_notes: npc.gm_notes, secrets: npc.secrets });
    setEditMode(false);
  };

  const handleSaveEdit = () => {
    if (!selectedNPC) return;
    updateEntity("npcs", selectedNPC.id, editFields);
    setEditMode(false);
    setSelectedNPC(null);
  };

  const handleDelete = () => {
    if (!selectedNPC) return;
    deleteEntity("npcs", selectedNPC.id);
    setDeleteOpen(false);
    setSelectedNPC(null);
  };

  const handleAddNPC = () => {
    if (!newNPC.name.trim()) return;
    addEntity("npcs", {
      name: newNPC.name,
      pronouns: "they/them",
      role_title: newNPC.role_title || "Unknown",
      public_bio: newNPC.public_bio,
      gm_notes: "",
      secrets: "",
      location_id: campaign.locations[0]?.id || "",
      tags: [],
      disposition: 0,
    });
    setNewNPC({ name: "", role_title: "", public_bio: "" });
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-cinzel text-brass">NPCs ({npcs.length})</h2>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search NPCs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add NPC
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredNPCs.map(npc => {
          const location = getLocation(npc.location_id);
          const faction = getFaction(npc.faction_id);
          return (
            <Card key={npc.id} className="border-brass/20 hover:border-brass/40 transition-colors cursor-pointer" onClick={() => handleSelectNPC(npc)}>
              <CardContent className="pt-4">
                <div className="flex gap-4">
                  <Avatar className="w-16 h-16 border-2 border-brass/30">
                    <AvatarImage src={npc.portrait_url} alt={npc.name} />
                    <AvatarFallback className="bg-brass/10 text-brass font-cinzel">{npc.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-cinzel font-semibold truncate">{npc.name}</h3>
                      {getDispositionIcon(npc.disposition)}
                    </div>
                    <p className="text-sm text-muted-foreground">{npc.role_title}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {location && <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" /><span>{location.name}</span></div>}
                  {faction && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" /><span>{faction.name}</span></div>}
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {npc.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* NPC Detail / Edit Dialog */}
      <Dialog open={!!selectedNPC} onOpenChange={() => { setSelectedNPC(null); setEditMode(false); }}>
        <DialogContent className="max-w-2xl">
          {selectedNPC && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel text-xl flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-brass/30">
                    <AvatarImage src={selectedNPC.portrait_url} alt={selectedNPC.name} />
                    <AvatarFallback className="bg-brass/10 text-brass">{selectedNPC.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {editMode ? (
                    <Input value={editFields.name} onChange={(e) => setEditFields(f => ({ ...f, name: e.target.value }))} className="font-cinzel" />
                  ) : (
                    <div><span>{selectedNPC.name}</span><p className="text-sm font-normal text-muted-foreground">{selectedNPC.role_title}</p></div>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!editMode && (
                  <div className="flex items-center gap-2">
                    {getDispositionIcon(selectedNPC.disposition)}
                    <span className="text-sm">{getDispositionLabel(selectedNPC.disposition)}</span>
                    <span className="text-xs text-muted-foreground">({selectedNPC.disposition})</span>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-brass mb-1">{editMode ? "Role Title" : "Public Information"}</h4>
                  {editMode ? (
                    <>
                      <Input value={editFields.role_title} onChange={(e) => setEditFields(f => ({ ...f, role_title: e.target.value }))} className="mb-2" placeholder="Role title" />
                      <Textarea value={editFields.public_bio} onChange={(e) => setEditFields(f => ({ ...f, public_bio: e.target.value }))} rows={3} placeholder="Public bio" />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{selectedNPC.public_bio}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-brass mb-1">DM Notes</h4>
                  {editMode ? (
                    <Textarea value={editFields.gm_notes} onChange={(e) => setEditFields(f => ({ ...f, gm_notes: e.target.value }))} rows={3} />
                  ) : (
                    <p className="text-sm text-muted-foreground">{selectedNPC.gm_notes}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-red-400 mb-1">Secrets</h4>
                  {editMode ? (
                    <Textarea value={editFields.secrets} onChange={(e) => setEditFields(f => ({ ...f, secrets: e.target.value }))} rows={2} />
                  ) : (
                    <p className="text-sm text-muted-foreground">{selectedNPC.secrets}</p>
                  )}
                </div>
              </div>
              <DialogFooter className="gap-2">
                {editMode ? (
                  <>
                    <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit}>Save</Button>
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

      {/* Add NPC Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-cinzel">New NPC</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name..." value={newNPC.name} onChange={(e) => setNewNPC(n => ({ ...n, name: e.target.value }))} />
            <Input placeholder="Role title..." value={newNPC.role_title} onChange={(e) => setNewNPC(n => ({ ...n, role_title: e.target.value }))} />
            <Textarea placeholder="Public bio..." value={newNPC.public_bio} onChange={(e) => setNewNPC(n => ({ ...n, public_bio: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNPC} disabled={!newNPC.name.trim()}>Create NPC</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete NPC</AlertDialogTitle>
            <AlertDialogDescription>Delete "{selectedNPC?.name}"? This cannot be undone.</AlertDialogDescription>
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
