import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CharacterNote {
  id?: string;
  character_id: string;
  character_name: string;
  content_markdown: string;
  hooks: string;
  secrets: string;
}

interface DMCharacterNotesProps {
  campaignId: string;
}

export function DMCharacterNotes({ campaignId }: DMCharacterNotesProps) {
  const [notes, setNotes] = useState<CharacterNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [campaignId]);

  const fetchNotes = async () => {
    try {
      // Get all PCs in campaign
      const { data: chars } = await supabase
        .from("characters")
        .select("id, name")
        .eq("campaign_id", campaignId)
        .not("user_id", "is", null);

      if (!chars || chars.length === 0) {
        setLoading(false);
        return;
      }

      // Get existing notes
      const { data: existingNotes } = await supabase
        .from("dm_character_notes")
        .select("*")
        .eq("campaign_id", campaignId);

      const notesMap = new Map((existingNotes || []).map(n => [n.character_id, n]));

      setNotes(chars.map(c => {
        const existing = notesMap.get(c.id);
        return {
          id: existing?.id,
          character_id: c.id,
          character_name: c.name,
          content_markdown: existing?.content_markdown || "",
          hooks: existing?.hooks || "",
          secrets: existing?.secrets || "",
        };
      }));
    } catch (error) {
      console.error("Failed to fetch DM notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = useCallback(async (note: CharacterNote) => {
    setSaving(note.character_id);
    try {
      if (note.id) {
        const { error } = await supabase
          .from("dm_character_notes")
          .update({
            content_markdown: note.content_markdown,
            hooks: note.hooks,
            secrets: note.secrets,
          })
          .eq("id", note.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("dm_character_notes")
          .insert({
            campaign_id: campaignId,
            character_id: note.character_id,
            content_markdown: note.content_markdown,
            hooks: note.hooks,
            secrets: note.secrets,
          })
          .select()
          .single();
        if (error) throw error;
        setNotes(prev => prev.map(n => n.character_id === note.character_id ? { ...n, id: data.id } : n));
      }
      toast({ title: `Notes saved for ${note.character_name}` });
    } catch (error: any) {
      toast({ title: "Error saving notes", description: error.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }, [campaignId, toast]);

  const updateNote = (charId: string, field: keyof CharacterNote, value: string) => {
    setNotes(prev => prev.map(n => n.character_id === charId ? { ...n, [field]: value } : n));
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading notes...</div>;
  }

  if (notes.length === 0) {
    return (
      <Card className="border-brass/20">
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="w-10 h-10 text-brass/40 mx-auto mb-2" />
          No player characters to add notes for yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-arcanePurple" />
        <h3 className="font-cinzel font-bold text-lg">DM Notes per PC</h3>
        <Badge variant="outline" className="border-brass/30 text-brass ml-auto text-xs">DM Only</Badge>
      </div>

      {notes.map((note) => (
        <Card key={note.character_id} className="border-brass/20 bg-card/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-cinzel font-semibold">{note.character_name}</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveNote(note)}
                disabled={saving === note.character_id}
                className="border-brass/30"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                {saving === note.character_id ? "Saving..." : "Save"}
              </Button>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">General Notes</Label>
              <Textarea
                value={note.content_markdown}
                onChange={(e) => updateNote(note.character_id, "content_markdown", e.target.value)}
                placeholder="General DM notes about this character..."
                className="mt-1 min-h-[60px] bg-background/50 border-brass/20"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Plot Hooks</Label>
              <Textarea
                value={note.hooks}
                onChange={(e) => updateNote(note.character_id, "hooks", e.target.value)}
                placeholder="Personal quests, backstory hooks..."
                className="mt-1 min-h-[40px] bg-background/50 border-brass/20"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Secrets</Label>
              <Textarea
                value={note.secrets}
                onChange={(e) => updateNote(note.character_id, "secrets", e.target.value)}
                placeholder="Things only the DM knows..."
                className="mt-1 min-h-[40px] bg-background/50 border-brass/20"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
