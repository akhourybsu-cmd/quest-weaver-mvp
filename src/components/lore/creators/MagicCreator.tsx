import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Wand2, Gem, BookOpen, Scale, Plus, X, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { LoreHeroHeader, LoreSection, LoreChronicle, LoreOrnamentDivider, RuneTag } from "../ui";
import { ImageUpload } from "@/components/ui/image-upload";

interface PowerTier {
  tier: string;
  description: string;
}

interface LorePage {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content_md?: string;
  tags?: string[];
  visibility?: string;
  details?: any;
}

interface MagicCreatorProps {
  campaignId: string;
  page?: LorePage;
  onSave: () => void;
  onCancel: () => void;
}

export default function MagicCreator({ campaignId, page, onSave, onCancel }: MagicCreatorProps) {
  const isEditing = !!page;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Magic-specific fields
  const [entryType, setEntryType] = useState("artifact");
  const [rarity, setRarity] = useState("uncommon");
  const [attunement, setAttunement] = useState(false);
  const [charges, setCharges] = useState("");
  const [sentience, setSentience] = useState(false);
  const [int, setInt] = useState("");
  const [wis, setWis] = useState("");
  const [cha, setCha] = useState("");
  const [ego, setEgo] = useState("");
  const [curse, setCurse] = useState("");
  const [powers, setPowers] = useState<PowerTier[]>([]);
  const [spells, setSpells] = useState<string[]>([]);
  const [opposedSchools, setOpposedSchools] = useState<string[]>([]);
  const [philosophy, setPhilosophy] = useState("");
  const [ruleText, setRuleText] = useState("");
  const [exceptions, setExceptions] = useState<string[]>([]);
  const [impact, setImpact] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  // Load existing page data when editing
  useEffect(() => {
    if (page) {
      setTitle(page.title || "");
      setSlug(page.slug || "");
      setSummary(page.excerpt || "");
      setContent(page.content_md || "");
      setTags(page.tags || []);
      setVisibility((page.visibility as "DM_ONLY" | "SHARED") || "DM_ONLY");
      
      const details = page.details || {};
      setEntryType(details.entryType || "artifact");
      setRarity(details.rarity || "uncommon");
      setAttunement(details.attunement || false);
      setCharges(details.charges?.toString() || "");
      setCurse(details.curse || "");
      setPowers(details.powers || []);
      setSpells(details.spells || []);
      setOpposedSchools(details.opposedSchools || []);
      setPhilosophy(details.philosophy || "");
      setRuleText(details.ruleText || "");
      setExceptions(details.exceptions || []);
      setImpact(details.impact || "");
      setImageUrl(details.image_url || null);
      
      if (details.sentience) {
        setSentience(true);
        setInt(details.sentience.int?.toString() || "");
        setWis(details.sentience.wis?.toString() || "");
        setCha(details.sentience.cha?.toString() || "");
        setEgo(details.sentience.ego?.toString() || "");
      }
    }
  }, [page]);

  useEffect(() => {
    if (title && !slug && !isEditing) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [title, isEditing]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (entryType === "artifact" && sentience) {
      if (!int || !wis || !cha) {
        toast.error("Sentient artifacts require INT, WIS, and CHA");
        return;
      }
    }

    setSaving(true);
    try {
      const details = {
        entryType,
        rarity: entryType === "artifact" ? rarity : null,
        attunement: entryType === "artifact" ? attunement : null,
        charges: entryType === "artifact" && charges ? parseInt(charges) : null,
        sentience: entryType === "artifact" ? (sentience ? {
          int: parseInt(int),
          wis: parseInt(wis),
          cha: parseInt(cha),
          ego: ego ? parseInt(ego) : null
        } : null) : null,
        curse: entryType === "artifact" ? curse : null,
        powers: entryType === "artifact" ? powers : null,
        spells: entryType === "school" || entryType === "tradition" ? spells : null,
        opposedSchools: entryType === "school" ? opposedSchools : null,
        philosophy: entryType === "school" || entryType === "tradition" ? philosophy : null,
        ruleText: entryType === "law" ? ruleText : null,
        exceptions: entryType === "law" ? exceptions : null,
        impact: entryType === "law" ? impact : null,
        image_url: imageUrl
      };

      const pageData = {
        campaign_id: campaignId,
        title,
        slug,
        content_md: content,
        excerpt: summary,
        tags,
        category: "magic",
        visibility,
        details: details as any
      };

      if (isEditing && page) {
        const { error } = await supabase
          .from("lore_pages")
          .update(pageData)
          .eq("id", page.id);
        if (error) throw error;
        toast.success("Magic entry updated successfully");
      } else {
        const { error } = await supabase.from("lore_pages").insert([pageData]);
        if (error) throw error;
        toast.success("Magic entry created successfully");
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
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("lore_pages")
        .delete()
        .eq("id", page.id);
      if (error) throw error;
      toast.success("Magic entry deleted");
      onSave();
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    } finally {
      setDeleting(false);
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

  const addPowerTier = () => {
    setPowers([...powers, { tier: "", description: "" }]);
  };

  const updatePowerTier = (index: number, field: keyof PowerTier, value: string) => {
    const newPowers = [...powers];
    newPowers[index][field] = value;
    setPowers(newPowers);
  };

  const removePowerTier = (index: number) => {
    setPowers(powers.filter((_, i) => i !== index));
  };

  const entryTypeLabels: Record<string, string> = {
    artifact: "Artifact",
    school: "School of Magic",
    tradition: "Arcane Tradition",
    law: "Magical Law"
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        <div className="lore-form-container space-y-6 pb-6">
          {/* Hero Header */}
          <LoreHeroHeader
            title={title}
            category="magic"
            visibility={visibility}
            slug={slug}
            subtitle={entryTypeLabels[entryType]}
          />

          {/* Banner Image */}
          <LoreSection title="Banner Image" icon={ImageIcon} accentClass="lore-accent-magic">
            <ImageUpload
              bucket="maps"
              path={`${campaignId}/lore/magic`}
              currentImageUrl={imageUrl}
              onImageUploaded={setImageUrl}
              label="Magic Entry Banner"
              aspectRatio="landscape"
            />
          </LoreSection>

          {/* Basic Info Section */}
          <LoreSection title="Basic Information" icon={Wand2} accentClass="lore-accent-magic">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Staff of the Archmagi"
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
              <ToggleGroup type="single" value={entryType} onValueChange={(v) => v && setEntryType(v)} className="justify-start">
                <ToggleGroupItem value="artifact" className="gap-1.5">
                  <Gem className="w-3.5 h-3.5" />
                  Artifact
                </ToggleGroupItem>
                <ToggleGroupItem value="school" className="gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  School
                </ToggleGroupItem>
                <ToggleGroupItem value="tradition" className="gap-1.5">
                  <Wand2 className="w-3.5 h-3.5" />
                  Tradition
                </ToggleGroupItem>
                <ToggleGroupItem value="law" className="gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  Law/Rule
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
                placeholder="evocation, legendary"
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

          {/* Artifact Section */}
          {entryType === "artifact" && (
            <LoreSection title="Artifact Details" icon={Gem} accentClass="lore-accent-magic">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select value={rarity} onValueChange={setRarity}>
                    <SelectTrigger className="bg-card/50 border-brass/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="very_rare">Very Rare</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                      <SelectItem value="artifact">Artifact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch checked={attunement} onCheckedChange={setAttunement} />
                    <Label>Requires Attunement</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Charges</Label>
                  <Input 
                    type="number" 
                    value={charges} 
                    onChange={(e) => setCharges(e.target.value)} 
                    placeholder="Optional" 
                    className="bg-card/50 border-brass/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch checked={sentience} onCheckedChange={setSentience} />
                  <Label>Sentient</Label>
                </div>
                {sentience && (
                  <div className="grid grid-cols-4 gap-2 pl-6">
                    <Input 
                      type="number" 
                      value={int} 
                      onChange={(e) => setInt(e.target.value)} 
                      placeholder="INT *" 
                      className="bg-card/50 border-brass/20"
                    />
                    <Input 
                      type="number" 
                      value={wis} 
                      onChange={(e) => setWis(e.target.value)} 
                      placeholder="WIS *" 
                      className="bg-card/50 border-brass/20"
                    />
                    <Input 
                      type="number" 
                      value={cha} 
                      onChange={(e) => setCha(e.target.value)} 
                      placeholder="CHA *" 
                      className="bg-card/50 border-brass/20"
                    />
                    <Input 
                      type="number" 
                      value={ego} 
                      onChange={(e) => setEgo(e.target.value)} 
                      placeholder="Ego" 
                      className="bg-card/50 border-brass/20"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Powers by Tier</Label>
                {powers.map((power, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input
                      value={power.tier}
                      onChange={(e) => updatePowerTier(idx, "tier", e.target.value)}
                      placeholder="Tier label"
                      className="w-32 bg-card/50 border-brass/20"
                    />
                    <Textarea
                      value={power.description}
                      onChange={(e) => updatePowerTier(idx, "description", e.target.value)}
                      placeholder="Power description"
                      rows={2}
                      className="flex-1 bg-card/50 border-brass/20"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removePowerTier(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPowerTier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Power Tier
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Curse</Label>
                <Textarea 
                  value={curse} 
                  onChange={(e) => setCurse(e.target.value)} 
                  placeholder="Any curse or drawback..." 
                  rows={3} 
                  className="bg-card/50 border-brass/20"
                />
              </div>
            </LoreSection>
          )}

          {/* School/Tradition Section */}
          {(entryType === "school" || entryType === "tradition") && (
            <LoreSection title={`${entryTypeLabels[entryType]} Details`} icon={BookOpen} accentClass="lore-accent-magic">
              <div className="space-y-2">
                <Label>Associated Spells</Label>
                <Input
                  placeholder="Fireball, Lightning Bolt"
                  className="bg-card/50 border-brass/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList(e.currentTarget.value, spells, setSpells);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                {spells.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {spells.map(s => (
                      <RuneTag key={s} variant="outline" onRemove={() => setSpells(spells.filter(x => x !== s))}>
                        {s}
                      </RuneTag>
                    ))}
                  </div>
                )}
              </div>
              {entryType === "school" && (
                <div className="space-y-2">
                  <Label>Opposed Schools</Label>
                  <Input
                    placeholder="Necromancy"
                    className="bg-card/50 border-brass/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(e.currentTarget.value, opposedSchools, setOpposedSchools);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  {opposedSchools.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {opposedSchools.map(o => (
                        <RuneTag key={o} variant="accent" onRemove={() => setOpposedSchools(opposedSchools.filter(x => x !== o))}>
                          {o}
                        </RuneTag>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>Philosophies / Methods</Label>
                <Textarea 
                  value={philosophy} 
                  onChange={(e) => setPhilosophy(e.target.value)} 
                  rows={4} 
                  className="bg-card/50 border-brass/20"
                />
              </div>
            </LoreSection>
          )}

          {/* Law Section */}
          {entryType === "law" && (
            <LoreSection title="Magical Law Details" icon={Scale} accentClass="lore-accent-magic">
              <div className="space-y-2">
                <Label>Rule Text</Label>
                <Textarea 
                  value={ruleText} 
                  onChange={(e) => setRuleText(e.target.value)} 
                  placeholder="The law as stated..." 
                  rows={4} 
                  className="bg-card/50 border-brass/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Known Exceptions</Label>
                <Input
                  placeholder="Exception case"
                  className="bg-card/50 border-brass/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList(e.currentTarget.value, exceptions, setExceptions);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                {exceptions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {exceptions.map(ex => (
                      <RuneTag key={ex} onRemove={() => setExceptions(exceptions.filter(x => x !== ex))}>
                        {ex}
                      </RuneTag>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>World Impact</Label>
                <Textarea 
                  value={impact} 
                  onChange={(e) => setImpact(e.target.value)} 
                  placeholder="How does this law affect the world?" 
                  rows={4} 
                  className="bg-card/50 border-brass/20"
                />
              </div>
            </LoreSection>
          )}

          <LoreOrnamentDivider />

          {/* Chronicle Section */}
          <LoreChronicle
            content={content}
            onChange={setContent}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            label="Full Description"
          />
        </div>
      </div>

      {/* Actions - Sticky Footer */}
      <div className="flex-shrink-0 flex gap-2 justify-between p-4 border-t border-brass/20 bg-card">
        {isEditing ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Magic Entry?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{title}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : <div />}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Update Entry" : "Save Entry"}
          </Button>
        </div>
      </div>
    </div>
  );
}
