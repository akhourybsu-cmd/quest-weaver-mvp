import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoLore } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Scroll, Sparkles, Mountain, Users, HelpCircle, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DemoLoreTabProps {
  campaign: DemoCampaign;
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  history: { label: "History", icon: <Clock className="w-4 h-4" />, color: "text-amber-400" },
  region: { label: "Regions", icon: <Mountain className="w-4 h-4" />, color: "text-emerald-400" },
  magic: { label: "Magic", icon: <Sparkles className="w-4 h-4" />, color: "text-purple-400" },
  myth: { label: "Myths", icon: <Scroll className="w-4 h-4" />, color: "text-blue-400" },
  faction: { label: "Factions", icon: <Users className="w-4 h-4" />, color: "text-red-400" },
  other: { label: "Other", icon: <HelpCircle className="w-4 h-4" />, color: "text-muted-foreground" },
};

export function DemoLoreTab({ campaign }: DemoLoreTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const lore = adaptDemoLore(campaign);
  const [selectedLore, setSelectedLore] = useState<ReturnType<typeof adaptDemoLore>[0] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ title: "", content: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [newLore, setNewLore] = useState({ title: "", content: "", category: "other" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const categories = Object.keys(categoryConfig);
  const loreByCategory = categories.reduce((acc, cat) => {
    acc[cat] = lore.filter(l => l.category === cat);
    return acc;
  }, {} as Record<string, typeof lore>);

  const handleSelect = (page: typeof lore[0]) => {
    setSelectedLore(page);
    setEditFields({ title: page.title, content: page.content });
    setEditMode(false);
  };

  const handleSave = () => {
    if (!selectedLore) return;
    updateEntity("lore", selectedLore.id, { title: editFields.title, content: editFields.content });
    setEditMode(false);
    setSelectedLore(null);
  };

  const handleDelete = () => {
    if (!selectedLore) return;
    deleteEntity("lore", selectedLore.id);
    setDeleteOpen(false);
    setSelectedLore(null);
  };

  const handleAdd = () => {
    if (!newLore.title.trim()) return;
    addEntity("lore", {
      title: newLore.title,
      category: newLore.category,
      content: newLore.content,
      show_on_timeline: false,
    });
    setNewLore({ title: "", content: "", category: "other" });
    setAddOpen(false);
  };

  const LoreCard = ({ page }: { page: typeof lore[0] }) => {
    const config = categoryConfig[page.category] || categoryConfig.other;
    return (
      <Card className="border-brass/20 hover:border-brass/40 transition-colors cursor-pointer overflow-hidden" onClick={() => handleSelect(page)}>
        {page.image_url && <div className="w-full h-32 overflow-hidden"><img src={page.image_url} alt={page.title} className="w-full h-full object-cover" /></div>}
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${config.color} text-xs`}>{config.icon}<span className="ml-1">{config.label}</span></Badge>
          </div>
          <CardTitle className="text-base font-cinzel">{page.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{page.content.slice(0, 150)}...</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brass" />
          <h2 className="text-xl font-cinzel text-brass">Campaign Lore</h2>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Lore</Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(cat => <TabsTrigger key={cat} value={cat} className="hidden lg:flex">{categoryConfig[cat].label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{lore.map(page => <LoreCard key={page.id} page={page} />)}</div>
        </TabsContent>
        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="mt-6">
            {loreByCategory[cat].length === 0 ? (
              <Card className="border-brass/20"><CardContent className="py-8 text-center text-muted-foreground">No {categoryConfig[cat].label.toLowerCase()} entries</CardContent></Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{loreByCategory[cat].map(page => <LoreCard key={page.id} page={page} />)}</div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail / Edit */}
      <Dialog open={!!selectedLore} onOpenChange={() => { setSelectedLore(null); setEditMode(false); }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLore && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel text-xl">
                  {editMode ? <Input value={editFields.title} onChange={(e) => setEditFields(f => ({ ...f, title: e.target.value }))} /> : selectedLore.title}
                </DialogTitle>
              </DialogHeader>
              {!editMode && selectedLore.image_url && <div className="w-full h-48 rounded-lg overflow-hidden"><img src={selectedLore.image_url} alt={selectedLore.title} className="w-full h-full object-cover" /></div>}
              <div className="space-y-4">
                {editMode ? (
                  <Textarea value={editFields.content} onChange={(e) => setEditFields(f => ({ ...f, content: e.target.value }))} rows={10} />
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{selectedLore.content}</ReactMarkdown></div>
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
          <DialogHeader><DialogTitle className="font-cinzel">New Lore Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Title..." value={newLore.title} onChange={(e) => setNewLore(n => ({ ...n, title: e.target.value }))} />
            <Select value={newLore.category} onValueChange={(v) => setNewLore(n => ({ ...n, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{categoryConfig[cat].label}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Content (supports markdown)..." value={newLore.content} onChange={(e) => setNewLore(n => ({ ...n, content: e.target.value }))} rows={6} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newLore.title.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Lore Entry</AlertDialogTitle><AlertDialogDescription>Delete "{selectedLore?.title}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
