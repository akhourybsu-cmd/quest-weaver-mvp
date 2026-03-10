import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoItems } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Package, Sparkles, Plus, Pencil, Trash2 } from "lucide-react";

interface DemoItemVaultTabProps {
  campaign: DemoCampaign;
}

export function DemoItemVaultTab({ campaign }: DemoItemVaultTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const items = adaptDemoItems(campaign);
  const [selected, setSelected] = useState<typeof items[0] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ name: "", description: "", rarity: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", description: "", type: "Weapon", rarity: "common" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case "legendary": return "border-orange-500/50 text-orange-500";
      case "very rare": return "border-purple-500/50 text-purple-500";
      case "rare": return "border-blue-500/50 text-blue-500";
      case "uncommon": return "border-green-500/50 text-green-500";
      default: return "border-brass/50 text-brass";
    }
  };

  const handleSelect = (item: typeof items[0]) => {
    setSelected(item);
    setEditFields({ name: item.name, description: item.description || "", rarity: item.rarity || "common" });
    setEditMode(false);
  };

  const handleSave = () => {
    if (!selected) return;
    updateEntity("items", selected.id, editFields);
    setEditMode(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteEntity("items", selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const handleAdd = () => {
    if (!newItem.name.trim()) return;
    addEntity("items", {
      name: newItem.name,
      type: newItem.type,
      rarity: newItem.rarity,
      description: newItem.description,
      attunement: false,
      properties: {},
    });
    setNewItem({ name: "", description: "", type: "Weapon", rarity: "common" });
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold">Item Vault</h2>
          <p className="text-muted-foreground">Magical items and treasures</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="bg-card/50 border-brass/20 hover:shadow-lg transition-all cursor-pointer" onClick={() => handleSelect(item)}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="font-cinzel flex items-center gap-2">
                    {item.requires_attunement ? <Sparkles className="w-5 h-5 text-arcanePurple" /> : <Package className="w-5 h-5 text-brass" />}
                    {item.name}
                  </CardTitle>
                  <CardDescription className="mt-1">{item.item_type}</CardDescription>
                </div>
                {item.rarity && <Badge variant="outline" className={getRarityColor(item.rarity)}>{item.rarity}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {item.description && <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail / Edit */}
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
                  <>
                    <Select value={editFields.rarity} onValueChange={(v) => setEditFields(f => ({ ...f, rarity: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="uncommon">Uncommon</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="very rare">Very Rare</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea value={editFields.description} onChange={(e) => setEditFields(f => ({ ...f, description: e.target.value }))} rows={4} />
                  </>
                ) : (
                  <>
                    {selected.rarity && <Badge variant="outline" className={getRarityColor(selected.rarity)}>{selected.rarity}</Badge>}
                    <p className="text-sm text-muted-foreground">{selected.description}</p>
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
          <DialogHeader><DialogTitle className="font-cinzel">New Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Item name..." value={newItem.name} onChange={(e) => setNewItem(n => ({ ...n, name: e.target.value }))} />
            <Select value={newItem.rarity} onValueChange={(v) => setNewItem(n => ({ ...n, rarity: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="common">Common</SelectItem>
                <SelectItem value="uncommon">Uncommon</SelectItem>
                <SelectItem value="rare">Rare</SelectItem>
                <SelectItem value="very rare">Very Rare</SelectItem>
                <SelectItem value="legendary">Legendary</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Description..." value={newItem.description} onChange={(e) => setNewItem(n => ({ ...n, description: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newItem.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Item</AlertDialogTitle><AlertDialogDescription>Delete "{selected?.name}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
