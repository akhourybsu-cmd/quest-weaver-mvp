import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoNotes } from "@/lib/demoAdapters";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Pin, Eye, EyeOff, Plus, Pencil, Trash2 } from "lucide-react";

interface DemoNotesTabProps {
  campaign: DemoCampaign;
}

export function DemoNotesTab({ campaign }: DemoNotesTabProps) {
  const { addEntity, updateEntity, deleteEntity } = useDemo();
  const notes = adaptDemoNotes(campaign);
  const [selected, setSelected] = useState<typeof notes[0] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ title: "", content_markdown: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content_markdown: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSelect = (note: typeof notes[0]) => {
    setSelected(note);
    setEditFields({ title: note.title, content_markdown: note.content_markdown });
    setEditMode(false);
  };

  const handleSave = () => {
    if (!selected) return;
    updateEntity("notes", selected.id, editFields);
    setEditMode(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteEntity("notes", selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const handleAdd = () => {
    if (!newNote.title.trim()) return;
    addEntity("notes", {
      title: newNote.title,
      content_markdown: newNote.content_markdown,
      visibility: "DM_ONLY",
      tags: [],
      is_pinned: false,
    });
    setNewNote({ title: "", content_markdown: "" });
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold">Notes</h2>
          <p className="text-muted-foreground">Campaign notes and observations</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Note
        </Button>
      </div>

      <div className="grid gap-4">
        {notes.map((note) => (
          <Card key={note.id} className="bg-card/50 border-brass/20 hover:shadow-lg transition-all cursor-pointer" onClick={() => handleSelect(note)}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="font-cinzel flex items-center gap-2">
                  <FileText className="w-5 h-5 text-arcanePurple" />
                  {note.title}
                  {note.is_pinned && <Pin className="w-4 h-4 text-brass" />}
                </CardTitle>
                <Badge variant="outline" className="border-brass/50 text-brass">
                  {note.visibility === "DM_ONLY" ? (
                    <span className="flex items-center gap-1"><EyeOff className="w-3 h-3" /> DM Only</span>
                  ) : (
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Shared</span>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{note.content_markdown}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail / Edit Dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setEditMode(false); }}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cinzel">
                  {editMode ? <Input value={editFields.title} onChange={(e) => setEditFields(f => ({ ...f, title: e.target.value }))} /> : selected.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {editMode ? (
                  <Textarea value={editFields.content_markdown} onChange={(e) => setEditFields(f => ({ ...f, content_markdown: e.target.value }))} rows={8} />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.content_markdown}</p>
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
          <DialogHeader><DialogTitle className="font-cinzel">New Note</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Title..." value={newNote.title} onChange={(e) => setNewNote(n => ({ ...n, title: e.target.value }))} />
            <Textarea placeholder="Content..." value={newNote.content_markdown} onChange={(e) => setNewNote(n => ({ ...n, content_markdown: e.target.value }))} rows={6} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newNote.title.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Note</AlertDialogTitle><AlertDialogDescription>Delete "{selected?.title}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
