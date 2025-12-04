import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sparkles, Star, Moon, Flame, Calendar } from "lucide-react";
import { toast } from "sonner";
import { LoreHeroHeader, LoreSection, LoreChronicle, LoreOrnamentDivider, RuneTag } from "../ui";

interface MythCreatorProps {
  campaignId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function MythCreator({ campaignId, onSave, onCancel }: MythCreatorProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  
  // Myth-specific fields
  const [entryType, setEntryType] = useState("deity");
  const [alignment, setAlignment] = useState("N");
  const [domains, setDomains] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [edicts, setEdicts] = useState<string[]>([]);
  const [anathema, setAnathema] = useState<string[]>([]);
  const [tradition, setTradition] = useState("");
  const [components, setComponents] = useState<string[]>([]);
  const [observanceDate, setObservanceDate] = useState("");
  const [miracles, setMiracles] = useState("");
  
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
    if (entryType === "deity" && domains.length === 0) {
      toast.error("Deity requires at least one domain");
      return;
    }
    if (entryType === "holy_day" && !observanceDate) {
      toast.error("Holy Day requires observance date");
      return;
    }

    setSaving(true);
    try {
      const details = {
        entryType,
        alignment: entryType === "deity" ? alignment : null,
        domains: entryType === "deity" ? domains : null,
        colors: entryType === "deity" ? colors : null,
        edicts: entryType === "deity" ? edicts : null,
        anathema: entryType === "deity" ? anathema : null,
        tradition: entryType !== "deity" ? tradition : null,
        components: entryType !== "deity" ? components : null,
        observanceDate: entryType === "holy_day" ? observanceDate : null,
        miracles
      };

      const { error } = await supabase.from("lore_pages").insert({
        campaign_id: campaignId,
        title,
        slug,
        content_md: content,
        excerpt: summary,
        tags,
        category: "religion",
        visibility,
        details
      });

      if (error) throw error;
      toast.success("Entry created successfully");
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

  const addToList = (value: string, list: string[], setter: (v: string[]) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setter([...list, value.trim()]);
    }
  };

  const entryTypeLabels: Record<string, string> = {
    deity: "Deity",
    myth: "Myth",
    ritual: "Ritual",
    holy_day: "Holy Day"
  };

  return (
    <ScrollArea className="h-[calc(90vh-12rem)]">
      <div className="lore-form-container space-y-6 pb-6 pr-4">
        {/* Hero Header */}
        <LoreHeroHeader
          title={title}
          category="religion"
          visibility={visibility}
          slug={slug}
          subtitle={entryTypeLabels[entryType]}
        />

        {/* Basic Info Section */}
        <LoreSection title="Basic Information" icon={Sparkles} accentClass="lore-accent-religion">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Solara, Goddess of Dawn"
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

          <div className="space-y-2">
            <Label>Entry Type</Label>
            <ToggleGroup type="single" value={entryType} onValueChange={setEntryType} className="justify-start">
              <ToggleGroupItem value="deity" className="gap-1.5">
                <Star className="w-3.5 h-3.5" />
                Deity
              </ToggleGroupItem>
              <ToggleGroupItem value="myth" className="gap-1.5">
                <Moon className="w-3.5 h-3.5" />
                Myth
              </ToggleGroupItem>
              <ToggleGroupItem value="ritual" className="gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Ritual
              </ToggleGroupItem>
              <ToggleGroupItem value="holy_day" className="gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Holy Day
              </ToggleGroupItem>
            </ToggleGroup>
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

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (press Enter to add)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="light, renewal"
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

        {/* Deity-specific Section */}
        {entryType === "deity" && (
          <LoreSection title="Deity Details" icon={Star} accentClass="lore-accent-religion">
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select value={alignment} onValueChange={setAlignment}>
                <SelectTrigger className="bg-card/50 border-brass/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LG">Lawful Good</SelectItem>
                  <SelectItem value="NG">Neutral Good</SelectItem>
                  <SelectItem value="CG">Chaotic Good</SelectItem>
                  <SelectItem value="LN">Lawful Neutral</SelectItem>
                  <SelectItem value="N">True Neutral</SelectItem>
                  <SelectItem value="CN">Chaotic Neutral</SelectItem>
                  <SelectItem value="LE">Lawful Evil</SelectItem>
                  <SelectItem value="NE">Neutral Evil</SelectItem>
                  <SelectItem value="CE">Chaotic Evil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Domains * (press Enter to add)</Label>
              <Input
                placeholder="Life, Light, Nature..."
                className="bg-card/50 border-brass/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList(e.currentTarget.value, domains, setDomains);
                    e.currentTarget.value = "";
                  }
                }}
              />
              {domains.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {domains.map(d => (
                    <RuneTag key={d} variant="accent" onRemove={() => setDomains(domains.filter(x => x !== d))}>
                      {d}
                    </RuneTag>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Holy Colors</Label>
              <Input
                placeholder="Gold, white"
                className="bg-card/50 border-brass/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList(e.currentTarget.value, colors, setColors);
                    e.currentTarget.value = "";
                  }
                }}
              />
              {colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <RuneTag key={c} variant="outline" onRemove={() => setColors(colors.filter(x => x !== c))}>
                      {c}
                    </RuneTag>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Edicts</Label>
                <Input
                  placeholder="Protect the innocent"
                  className="bg-card/50 border-brass/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList(e.currentTarget.value, edicts, setEdicts);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                {edicts.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {edicts.map(edict => (
                      <RuneTag key={edict} onRemove={() => setEdicts(edicts.filter(x => x !== edict))}>
                        {edict}
                      </RuneTag>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Anathema</Label>
                <Input
                  placeholder="Cause needless harm"
                  className="bg-card/50 border-brass/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList(e.currentTarget.value, anathema, setAnathema);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                {anathema.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {anathema.map(a => (
                      <RuneTag key={a} variant="outline" onRemove={() => setAnathema(anathema.filter(x => x !== a))}>
                        {a}
                      </RuneTag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </LoreSection>
        )}

        {/* Non-deity Section */}
        {entryType !== "deity" && (
          <LoreSection 
            title={`${entryTypeLabels[entryType]} Details`} 
            icon={entryType === "holy_day" ? Calendar : Flame} 
            accentClass="lore-accent-religion"
          >
            <div className="space-y-2">
              <Label>Tradition</Label>
              <Input 
                value={tradition} 
                onChange={(e) => setTradition(e.target.value)} 
                placeholder="Ancient practice..." 
                className="bg-card/50 border-brass/20"
              />
            </div>
            {entryType === "holy_day" && (
              <div className="space-y-2">
                <Label>Observance Date *</Label>
                <Input
                  value={observanceDate}
                  onChange={(e) => setObservanceDate(e.target.value)}
                  placeholder="Spring Equinox"
                  className="bg-card/50 border-brass/20"
                />
              </div>
            )}
            {(entryType === "ritual" || entryType === "holy_day") && (
              <div className="space-y-2">
                <Label>Components / Offerings</Label>
                <Input
                  placeholder="Incense, flowers"
                  className="bg-card/50 border-brass/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList(e.currentTarget.value, components, setComponents);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                {components.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {components.map(c => (
                      <RuneTag key={c} variant="outline" onRemove={() => setComponents(components.filter(x => x !== c))}>
                        {c}
                      </RuneTag>
                    ))}
                  </div>
                )}
              </div>
            )}
          </LoreSection>
        )}

        {/* Miracles Section */}
        <LoreSection title="Miracles / Interventions" icon={Sparkles} accentClass="lore-accent-religion">
          <Textarea
            value={miracles}
            onChange={(e) => setMiracles(e.target.value)}
            placeholder="Known miracles or divine interventions..."
            rows={4}
            className="bg-card/50 border-brass/20"
          />
        </LoreSection>

        <LoreOrnamentDivider />

        {/* Chronicle Section */}
        <LoreChronicle
          content={content}
          onChange={setContent}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          label="Full Description"
        />

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-brass/20">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
