import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Calendar, BookOpen, Quote, Settings, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LoreHeroHeader, LoreSection, LoreChronicle, LoreOrnamentDivider, RuneTag, HistoryStatBar } from "../ui";
import EraManager from "../EraManager";
import { ImageUpload } from "@/components/ui/image-upload";

interface LorePage {
  id: string;
  campaign_id: string;
  title: string;
  slug: string;
  content_md: string;
  excerpt: string | null;
  tags: string[];
  category: string;
  era: string | null;
  visibility: 'DM_ONLY' | 'SHARED' | 'PUBLIC';
  details?: Record<string, any> | null;
}

interface HistoryCreatorProps {
  campaignId: string;
  page?: LorePage | null;
  onSave: () => void;
  onCancel: () => void;
}

interface Era {
  id: string;
  name: string;
  sort_order: number;
}

export default function HistoryCreator({ campaignId, page, onSave, onCancel }: HistoryCreatorProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // History-specific fields
  const [date, setDate] = useState("");
  const [era, setEra] = useState("");
  const [eventType, setEventType] = useState("other");
  const [outcome, setOutcome] = useState("");
  const [showOnTimeline, setShowOnTimeline] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  
  const [eras, setEras] = useState<Era[]>([]);
  const [eraManagerOpen, setEraManagerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load existing page data when editing
  useEffect(() => {
    if (page) {
      setTitle(page.title || "");
      setSlug(page.slug || "");
      setSummary(page.excerpt || "");
      setContent(page.content_md || "");
      setTags(page.tags || []);
      setVisibility((page.visibility as "DM_ONLY" | "SHARED") || "DM_ONLY");
      
      // Load history-specific details
      const details = page.details || {};
      setDate(details.date || "");
      setEra(details.era || page.era || "");
      setEventType(details.type || "other");
      setOutcome(details.outcome || "");
      setShowOnTimeline(details.showOnTimeline || false);
      setSources(details.sources || []);
      setImageUrl(details.image_url || null);
    }
  }, [page]);

  // Load campaign eras
  useEffect(() => {
    loadEras();
  }, [campaignId]);

  const loadEras = async () => {
    const { data } = await supabase
      .from("campaign_eras")
      .select("id, name, sort_order")
      .eq("campaign_id", campaignId)
      .order("sort_order", { ascending: true });
    setEras(data || []);
  };

  useEffect(() => {
    if (title && !slug && !page) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [title, page]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!date.trim()) {
      toast.error("Date/Year is required");
      return;
    }

    setSaving(true);
    try {
      const details = {
        date,
        era,
        type: eventType,
        outcome,
        showOnTimeline,
        sources,
        image_url: imageUrl
      };

      const pageData = {
        campaign_id: campaignId,
        title,
        slug,
        content_md: content,
        excerpt: summary,
        tags,
        category: "history",
        visibility,
        era,
        details
      };

      if (page) {
        const { error } = await supabase
          .from("lore_pages")
          .update(pageData)
          .eq("id", page.id);
        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        const { error } = await supabase.from("lore_pages").insert(pageData);
        if (error) throw error;
        toast.success("Event created successfully");
      }
      
      onSave();
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!page) return;
    
    try {
      const { error } = await supabase
        .from("lore_pages")
        .delete()
        .eq("id", page.id);
      
      if (error) throw error;
      toast.success("Event deleted");
      onSave();
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const addSource = (value: string) => {
    if (value.trim() && !sources.includes(value.trim())) {
      setSources([...sources, value.trim()]);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="lore-form-container space-y-6 p-4 pb-8">
        {/* Hero Header */}
        <LoreHeroHeader
          title={title || "New Historical Event"}
          category="history"
          visibility={visibility}
          era={era || date}
          slug={slug}
        >
          <HistoryStatBar
            date={date}
            era={era}
            eventType={eventType}
          />
        </LoreHeroHeader>

        {/* Banner Image */}
        <LoreSection title="Banner Image" icon={ImageIcon} accentClass="lore-accent-history">
          <ImageUpload
            bucket="maps"
            path={`${campaignId}/lore/history`}
            currentImageUrl={imageUrl}
            onImageUploaded={setImageUrl}
            label="Event Banner"
            aspectRatio="landscape"
          />
        </LoreSection>

        {/* When & Where Section */}
        <LoreSection title="When & Where" icon={Calendar} accentClass="lore-accent-history">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Battle of Crimson Fields"
                className="bg-card/50 border-brass/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="bg-card/50 border-brass/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="war">War</SelectItem>
                  <SelectItem value="battle">Battle</SelectItem>
                  <SelectItem value="discovery">Discovery</SelectItem>
                  <SelectItem value="cataclysm">Cataclysm</SelectItem>
                  <SelectItem value="coronation">Coronation</SelectItem>
                  <SelectItem value="treaty">Treaty</SelectItem>
                  <SelectItem value="founding">Founding</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A brief overview..."
              rows={2}
              className="bg-card/50 border-brass/20"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date/Year *</Label>
              <Input
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="-432 or 30 HA"
                className="bg-card/50 border-brass/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="era" className="flex items-center gap-2">
                Era
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5" 
                  onClick={() => setEraManagerOpen(true)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </Label>
              {eras.length > 0 ? (
                <Select value={era} onValueChange={setEra}>
                  <SelectTrigger className="bg-card/50 border-brass/20">
                    <SelectValue placeholder="Select an era" />
                  </SelectTrigger>
                  <SelectContent>
                    {eras.map(e => (
                      <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="era"
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  placeholder="Halcyon Age"
                  className="bg-card/50 border-brass/20"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger className="bg-card/50 border-brass/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DM_ONLY">DM Only</SelectItem>
                  <SelectItem value="SHARED">Shared</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={showOnTimeline} onCheckedChange={setShowOnTimeline} />
            <Label>Show on World Timeline</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (press Enter to add)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="war, alliance"
              className="bg-card/50 border-brass/20"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <RuneTag key={tag} onRemove={() => setTags(tags.filter(t => t !== tag))}>
                    {tag}
                  </RuneTag>
                ))}
              </div>
            )}
          </div>
        </LoreSection>

        <LoreOrnamentDivider />

        {/* Outcome Section */}
        <LoreSection title="Outcome & Consequences" icon={BookOpen} accentClass="lore-accent-history">
          <div className="space-y-2">
            <Label>Outcome / Consequences</Label>
            <Textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="What happened as a result of this event?"
              rows={4}
              className="bg-card/50 border-brass/20"
            />
          </div>
        </LoreSection>

        {/* Sources Section */}
        <LoreSection title="Sources & Citations" icon={Quote} accentClass="lore-accent-history">
          <div className="space-y-2">
            <Label>Sources (press Enter to add)</Label>
            <Input
              placeholder="Book reference, URL, or note"
              className="bg-card/50 border-brass/20"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSource(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
            {sources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sources.map(src => (
                  <RuneTag key={src} variant="outline" onRemove={() => setSources(sources.filter(s => s !== src))}>
                    {src}
                  </RuneTag>
                ))}
              </div>
            )}
          </div>
        </LoreSection>

        <LoreOrnamentDivider />

        {/* Chronicle Section */}
        <LoreChronicle
          content={content}
          onChange={setContent}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          label="Full Narrative"
        />

        {/* Actions */}
        <div className="flex gap-2 justify-between pt-4 border-t border-brass/20">
          <div>
            {page && (
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : page ? "Update Event" : "Save Event"}
            </Button>
          </div>
        </div>
      </div>

      <EraManager
        campaignId={campaignId}
        open={eraManagerOpen}
        onOpenChange={setEraManagerOpen}
        onErasChange={loadEras}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="fantasy-border-brass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Historical Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}