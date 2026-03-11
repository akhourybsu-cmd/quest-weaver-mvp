import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2, Save, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChangeEntry {
  id?: string;
  type: "feature" | "improvement" | "fix";
  description: string;
  sort_order: number;
}

interface ChangelogEntryForm {
  id?: string;
  version: string;
  date: string;
  title: string;
  sort_order: number;
  changes: ChangeEntry[];
}

export default function ChangelogAdmin() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  const [entries, setEntries] = useState<ChangelogEntryForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEntry, setNewEntry] = useState<ChangelogEntryForm>({
    version: "",
    date: "",
    title: "",
    sort_order: 0,
    changes: [{ type: "feature", description: "", sort_order: 0 }],
  });

  useEffect(() => {
    if (isAdmin) fetchEntries();
  }, [isAdmin]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data: entriesData } = await supabase
      .from("changelog_entries")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!entriesData) { setLoading(false); return; }

    const entriesWithChanges: ChangelogEntryForm[] = [];
    for (const entry of entriesData) {
      const { data: changes } = await supabase
        .from("changelog_changes")
        .select("*")
        .eq("entry_id", entry.id)
        .order("sort_order", { ascending: true });

      entriesWithChanges.push({
        id: entry.id,
        version: entry.version,
        date: entry.date,
        title: entry.title,
        sort_order: entry.sort_order,
        changes: (changes || []).map(c => ({
          id: c.id,
          type: c.type as "feature" | "improvement" | "fix",
          description: c.description,
          sort_order: c.sort_order,
        })),
      });
    }
    setEntries(entriesWithChanges);
    setLoading(false);
  };

  const addNewEntry = async () => {
    if (!newEntry.version || !newEntry.title || !newEntry.date) {
      toast({ title: "Missing fields", description: "Version, date, and title are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: inserted, error } = await supabase
        .from("changelog_entries")
        .insert({
          version: newEntry.version,
          date: newEntry.date,
          title: newEntry.title,
          sort_order: newEntry.sort_order,
        })
        .select()
        .single();

      if (error) throw error;

      const validChanges = newEntry.changes.filter(c => c.description.trim());
      if (validChanges.length > 0) {
        const { error: changesError } = await supabase
          .from("changelog_changes")
          .insert(validChanges.map((c, i) => ({
            entry_id: inserted.id,
            type: c.type,
            description: c.description,
            sort_order: i,
          })));
        if (changesError) throw changesError;
      }

      toast({ title: "Added", description: `v${newEntry.version} added to changelog` });
      setNewEntry({ version: "", date: "", title: "", sort_order: 0, changes: [{ type: "feature", description: "", sort_order: 0 }] });
      await fetchEntries();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to add", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("changelog_entries").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      await fetchEntries();
    }
  };

  const addChangeToNew = () => {
    setNewEntry(prev => ({
      ...prev,
      changes: [...prev.changes, { type: "feature", description: "", sort_order: prev.changes.length }],
    }));
  };

  const updateNewChange = (idx: number, field: keyof ChangeEntry, value: string) => {
    setNewEntry(prev => ({
      ...prev,
      changes: prev.changes.map((c, i) => i === idx ? { ...c, [field]: value } : c),
    }));
  };

  const removeNewChange = (idx: number) => {
    setNewEntry(prev => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== idx),
    }));
  };

  if (adminLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!isAdmin) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="flex items-center gap-3 p-6">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <p>Admin access required to manage the changelog.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Entry */}
      <Card className="border-2 border-brand-arcanePurple/30">
        <CardHeader>
          <CardTitle className="text-lg">Add Changelog Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Version</Label>
              <Input placeholder="2.1.0" value={newEntry.version} onChange={e => setNewEntry(p => ({ ...p, version: e.target.value }))} />
            </div>
            <div>
              <Label>Date</Label>
              <Input placeholder="March 11, 2026" value={newEntry.date} onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={newEntry.sort_order} onChange={e => setNewEntry(p => ({ ...p, sort_order: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <Label>Title</Label>
            <Input placeholder="Release title" value={newEntry.title} onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Changes</Label>
            {newEntry.changes.map((change, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Select value={change.type} onValueChange={v => updateNewChange(idx, "type", v)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="fix">Fix</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Description"
                  value={change.description}
                  onChange={e => updateNewChange(idx, "description", e.target.value)}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removeNewChange(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addChangeToNew}>
              <Plus className="h-3 w-3 mr-1" /> Add Change
            </Button>
          </div>

          <Button onClick={addNewEntry} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Entry
          </Button>
        </CardContent>
      </Card>

      {/* Existing Entries */}
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Existing Entries ({entries.length})</h3>
          {entries.map(entry => (
            <Card key={entry.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm mr-2">v{entry.version}</span>
                  <span className="font-semibold">{entry.title}</span>
                  <span className="text-muted-foreground text-sm ml-2">{entry.date}</span>
                  <span className="text-muted-foreground text-xs ml-2">({entry.changes.length} changes)</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => entry.id && deleteEntry(entry.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
