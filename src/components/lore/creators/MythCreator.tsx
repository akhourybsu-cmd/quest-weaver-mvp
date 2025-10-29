import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { X } from "lucide-react";
import { toast } from "sonner";

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
  const [clergyTitles, setClergyTitles] = useState<string[]>([]);
  const [cultures, setCultures] = useState<string[]>([]);
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
        clergyTitles: entryType === "deity" ? clergyTitles : null,
        cultures: entryType === "deity" ? cultures : null,
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

  return (
    <ScrollArea className="h-[calc(90vh-12rem)] pr-4">
      <div className="space-y-6 pb-6">
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Solara, Goddess of Dawn"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="solara"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Entry Type</Label>
            <ToggleGroup type="single" value={entryType} onValueChange={setEntryType}>
              <ToggleGroupItem value="deity">Deity</ToggleGroupItem>
              <ToggleGroupItem value="myth">Myth</ToggleGroupItem>
              <ToggleGroupItem value="ritual">Ritual</ToggleGroupItem>
              <ToggleGroupItem value="holy_day">Holy Day</ToggleGroupItem>
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
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DM_ONLY">DM Only</SelectItem>
                  <SelectItem value="SHARED">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (press Enter to add)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="light, renewal"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))} />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {entryType === "deity" && (
          <Card>
            <CardHeader>
              <CardTitle>Deity Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Alignment</Label>
                <Select value={alignment} onValueChange={setAlignment}>
                  <SelectTrigger>
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList(e.currentTarget.value, domains, setDomains);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {domains.map(d => (
                    <Badge key={d} variant="default">
                      {d}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setDomains(domains.filter(x => x !== d))} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Holy Colors</Label>
                <Input
                  placeholder="Gold, white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList(e.currentTarget.value, colors, setColors);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <Badge key={c} variant="outline">
                      {c}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setColors(colors.filter(x => x !== c))} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Edicts</Label>
                  <Input
                    placeholder="Protect the innocent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(e.currentTarget.value, edicts, setEdicts);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-1">
                    {edicts.map(e => (
                      <Badge key={e} variant="secondary" className="text-xs">
                        {e}
                        <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setEdicts(edicts.filter(x => x !== e))} />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Anathema</Label>
                  <Input
                    placeholder="Cause needless harm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(e.currentTarget.value, anathema, setAnathema);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-1">
                    {anathema.map(a => (
                      <Badge key={a} variant="secondary" className="text-xs">
                        {a}
                        <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setAnathema(anathema.filter(x => x !== a))} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {entryType !== "deity" && (
          <Card>
            <CardHeader>
              <CardTitle>{entryType === "holy_day" ? "Holy Day" : entryType === "ritual" ? "Ritual" : "Myth"} Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tradition</Label>
                <Input value={tradition} onChange={(e) => setTradition(e.target.value)} placeholder="Ancient practice..." />
              </div>
              {entryType === "holy_day" && (
                <div className="space-y-2">
                  <Label>Observance Date *</Label>
                  <Input
                    value={observanceDate}
                    onChange={(e) => setObservanceDate(e.target.value)}
                    placeholder="Spring Equinox"
                  />
                </div>
              )}
              {(entryType === "ritual" || entryType === "holy_day") && (
                <div className="space-y-2">
                  <Label>Components / Offerings</Label>
                  <Input
                    placeholder="Incense, flowers"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(e.currentTarget.value, components, setComponents);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {components.map(c => (
                      <Badge key={c} variant="outline">
                        {c}
                        <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setComponents(components.filter(x => x !== c))} />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Miracles / Interventions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={miracles}
              onChange={(e) => setMiracles(e.target.value)}
              placeholder="Known miracles or divine interventions..."
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label>Full Description</Label>
          <p className="text-xs text-muted-foreground">
            Use: [[Page]], @NPC, #Location, %Faction, !Quest, $Item
          </p>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="font-mono"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="prose prose-sm max-w-none p-4 border rounded-md min-h-[300px]">
                {content || <span className="text-muted-foreground">No content yet...</span>}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
