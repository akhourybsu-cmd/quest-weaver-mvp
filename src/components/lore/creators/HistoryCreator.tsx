import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Calendar, BookOpen, Quote } from "lucide-react";
import { toast } from "sonner";
import { LoreHeroHeader, LoreSection, LoreChronicle, LoreOrnamentDivider, RuneTag, HistoryStatBar } from "../ui";

interface HistoryCreatorProps {
  campaignId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function HistoryCreator({ campaignId, onSave, onCancel }: HistoryCreatorProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  
  // History-specific fields
  const [date, setDate] = useState("");
  const [era, setEra] = useState("");
  const [eventType, setEventType] = useState("other");
  const [outcome, setOutcome] = useState("");
  const [showOnTimeline, setShowOnTimeline] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  useEffect(() => {
    if (title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [title]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!date.trim()) {
      toast.error("Date/Year is required");
      return;
    }
    if (showOnTimeline && !date && !era) {
      toast.error("Timeline anchor requires date or era");
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
        sources
      };

      const { error } = await supabase.from("lore_pages").insert({
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
      });

      if (error) throw error;
      toast.success("Historical event created successfully");
      onSave();
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(false);
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
    <ScrollArea className="h-[calc(90vh-12rem)]">
      <div className="lore-form-container space-y-6 pb-6 pr-4">
        {/* Hero Header */}
        <LoreHeroHeader
          title={title}
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
              <Label htmlFor="era">Era</Label>
              <Input
                id="era"
                value={era}
                onChange={(e) => setEra(e.target.value)}
                placeholder="Halcyon Age"
                className="bg-card/50 border-brass/20"
              />
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
        <div className="flex gap-2 justify-end pt-4 border-t border-brass/20">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Event"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
