import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, ScrollText, Search, Pin, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { resilientChannel } from '@/lib/realtime';
import { WikilinkText } from '@/components/notes/editor/WikilinkText';
import { useIsMobile } from '@/hooks/use-mobile';
import { PlayerEmptyState } from './PlayerEmptyState';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  updated_at: string;
  campaign_id: string;
  campaign_name?: string;
}

interface PlayerNotesViewProps {
  playerId: string;
  campaignId?: string;
}

export function PlayerNotesView({ playerId, campaignId }: PlayerNotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadSharedNotes();

    const channel = resilientChannel(supabase, `player-notes-${playerId}-${campaignId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_notes',
          filter: `visibility=eq.SHARED`,
        },
        () => { loadSharedNotes(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [playerId, campaignId]);

  const loadSharedNotes = async () => {
    try {
      let campaignIds: string[];
      let campaignNameMap: Record<string, string> = {};

      if (campaignId) {
        campaignIds = [campaignId];
        const { data: campaignData } = await supabase
          .from('campaigns')
          .select('name')
          .eq('id', campaignId)
          .single();
        if (campaignData) {
          campaignNameMap[campaignId] = campaignData.name;
        }
      } else {
        const { data: links } = await supabase
          .from('player_campaign_links')
          .select('campaign_id, campaigns(name)')
          .eq('player_id', playerId);

        if (!links || links.length === 0) {
          setNotes([]);
          setLoading(false);
          return;
        }

        campaignIds = links.map(l => l.campaign_id);
        links.forEach(l => {
          campaignNameMap[l.campaign_id] = (l.campaigns as any)?.name || 'Unknown Campaign';
        });
      }

      const { data: notesData, error } = await supabase
        .from('session_notes')
        .select('id, title, content_markdown, tags, is_pinned, updated_at, campaign_id')
        .in('campaign_id', campaignIds)
        .eq('visibility', 'SHARED')
        .is('deleted_at', null)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const notesWithCampaigns = notesData?.map(note => ({
        id: note.id,
        title: note.title || 'Untitled',
        content: note.content_markdown || '',
        tags: note.tags || [],
        is_pinned: note.is_pinned || false,
        updated_at: note.updated_at,
        campaign_id: note.campaign_id,
        campaign_name: campaignNameMap[note.campaign_id] || 'Unknown Campaign',
      })) || [];

      setNotes(notesWithCampaigns);
    } catch (error) {
      console.error('Error loading shared notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags.some(tag => tag.toLowerCase().includes(query)) ||
      note.campaign_name?.toLowerCase().includes(query)
    );
  });

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    if (isMobile) {
      setMobileSheetOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <PlayerEmptyState
        icon={ScrollText}
        title="No Shared Notes"
        description="Your DM will share notes with you during sessions. Check back after your next adventure!"
      />
    );
  }

  const noteContent = selectedNote && (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p><WikilinkText>{children}</WikilinkText></p>,
          li: ({ children }) => <li><WikilinkText>{children}</WikilinkText></li>,
          td: ({ children }) => <td><WikilinkText>{children}</WikilinkText></td>,
        }}
      >
        {selectedNote.content}
      </ReactMarkdown>
    </div>
  );

  return (
    <>
      {/* Mobile note reader sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileSheetOpen(false)} className="shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <SheetTitle className="font-cinzel text-lg truncate flex items-center gap-2">
                  {selectedNote?.is_pinned && <Pin className="w-3 h-3 text-brass fill-brass shrink-0" />}
                  {selectedNote?.title}
                </SheetTitle>
                {selectedNote && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedNote.campaign_name} • {format(new Date(selectedNote.updated_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
            {selectedNote?.tags && selectedNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedNote.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </SheetHeader>
          <Separator />
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 py-4">
              {noteContent}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-[300px] overflow-hidden">
        {/* Notes List */}
        <div className="lg:col-span-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search shared notes..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 pr-2">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No notes match your search</p>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <Card key={note.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedNote?.id === note.id ? 'border-brass bg-brass/5' : 'border-border'
                    }`}
                    onClick={() => handleSelectNote(note)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-cinzel flex items-center gap-2">
                          {note.is_pinned && <Pin className="w-3 h-3 text-brass fill-brass" />}
                          {note.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs">
                        {note.campaign_name} • {format(new Date(note.updated_at), 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    {note.tags.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{note.tags.length - 3}</Badge>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Note Content — desktop only */}
        <div className="lg:col-span-2 hidden lg:flex flex-col min-h-0">
          {selectedNote ? (
            <Card className="flex flex-col flex-1 min-h-0">
              <CardHeader className="shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-cinzel flex items-center gap-2">
                      {selectedNote.is_pinned && <Pin className="w-4 h-4 text-brass fill-brass" />}
                      {selectedNote.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedNote.campaign_name} • {format(new Date(selectedNote.updated_at), 'MMMM d, yyyy')}
                    </CardDescription>
                  </div>
                </div>
                {selectedNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedNote.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <Separator />
              <ScrollArea className="flex-1 min-h-0">
                <CardContent className="pt-6">
                  {noteContent}
                </CardContent>
              </ScrollArea>
            </Card>
          ) : (
            <Card className="flex-1 border-dashed flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center text-center py-16">
                <ScrollText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="font-cinzel text-lg font-semibold mb-2">Select a note to read</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Choose a shared note from the list to view its full content.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
