import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Zap, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NoteFolderSelector from './NoteFolderSelector';

interface QuickCaptureModalProps {
  campaignId: string;
  userId: string;
  isDM: boolean;
}

interface ContextEntity {
  type: 'NPC' | 'QUEST' | 'LOCATION' | 'CHARACTER';
  id: string;
  name: string;
}

export function QuickCaptureModal({ campaignId, userId, isDM }: QuickCaptureModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState<string | null>(null);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [contextEntity, setContextEntity] = useState<ContextEntity | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const detectContext = useCallback(async () => {
    const tags: string[] = [];
    let entity: ContextEntity | null = null;

    const npcId = searchParams.get('npc');
    const questId = searchParams.get('quest');
    const locationId = searchParams.get('location');
    const characterId = searchParams.get('character');

    try {
      if (npcId) {
        const { data } = await supabase.from('npcs').select('id, name').eq('id', npcId).single();
        if (data) { entity = { type: 'NPC', id: data.id, name: data.name }; tags.push('npc'); }
      } else if (questId) {
        const { data } = await supabase.from('quests').select('id, title').eq('id', questId).single();
        if (data) { entity = { type: 'QUEST', id: data.id, name: data.title }; tags.push('quest'); }
      } else if (locationId) {
        const { data } = await supabase.from('locations').select('id, name').eq('id', locationId).single();
        if (data) { entity = { type: 'LOCATION', id: data.id, name: data.name }; tags.push('location'); }
      } else if (characterId) {
        const { data } = await supabase.from('characters').select('id, name').eq('id', characterId).single();
        if (data) { entity = { type: 'CHARACTER', id: data.id, name: data.name }; tags.push('combat'); }
      }

      const sessionId = searchParams.get('session');
      if (sessionId) tags.push('session note');
    } catch (error) {
      console.error('Error detecting context:', error);
    }

    setAutoTags(tags);
    setContextEntity(entity);
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setOpen(true);
        detectContext();
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, detectContext]);

  useEffect(() => {
    if (open) detectContext();
  }, [open, detectContext]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please add a title to your note', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      // Normalize tags to lowercase
      const normalizedTags = autoTags.map(t => t.trim().toLowerCase());

      // Let DB generate UUID — use .select('id') to get it back
      const { data, error: noteError } = await supabase.from('session_notes').insert({
        campaign_id: campaignId,
        author_id: userId,
        title: title.trim(),
        content_markdown: content.trim(),
        visibility: isDM ? 'DM_ONLY' : 'PRIVATE',
        tags: normalizedTags,
        is_pinned: false,
        folder,
      }).select('id').single();

      if (noteError) throw noteError;

      // Create link if context entity exists, using DB-generated ID
      if (contextEntity && data) {
        const { error: linkError } = await supabase.from('note_links').insert({
          note_id: data.id,
          link_type: contextEntity.type,
          link_id: contextEntity.id,
          label: contextEntity.name,
        });
        if (linkError) console.error('Error creating link:', linkError);
      }

      toast({ title: 'Note captured!', description: `"${title}" has been saved` });
      setTitle('');
      setContent('');
      setFolder(null);
      setAutoTags([]);
      setContextEntity(null);
      setOpen(false);
    } catch (error: any) {
      toast({ title: 'Error saving note', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setAutoTags(autoTags.filter(t => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brass" />Quick Capture
          </DialogTitle>
          <DialogDescription>
            Rapidly capture a note during your session. Press{' '}
            <kbd className="px-2 py-1 text-xs font-semibold border rounded bg-muted">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+J
            </kbd>{' '}anytime to open this.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {contextEntity && (
            <div className="p-3 rounded-lg bg-brass/10 border border-brass/30">
              <p className="text-sm font-medium text-foreground">
                📍 Context detected: <span className="text-brass">{contextEntity.name}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This note will be automatically linked to this {contextEntity.type.toLowerCase()}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quick-title">Title</Label>
            <Input id="quick-title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Quick note title..." autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(); }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-content">Content</Label>
            <Textarea id="quick-content" value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Jot down your thoughts..." rows={6}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(); }} />
          </div>

          <div className="space-y-2">
            <Label>Notebook (optional)</Label>
            <NoteFolderSelector campaignId={campaignId} value={folder} onChange={setFolder} className="w-full" />
          </div>

          {autoTags.length > 0 && (
            <div className="space-y-2">
              <Label>Auto-detected tags</Label>
              <div className="flex flex-wrap gap-2">
                {autoTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => handleRemoveTag(tag)} />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Tip: Press{' '}
              <kbd className="px-1.5 py-0.5 text-xs border rounded bg-muted">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
              </kbd>{' '}to save quickly
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
                {isSaving ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
