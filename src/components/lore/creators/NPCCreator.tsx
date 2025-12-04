import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Heart, Lock, Mic } from "lucide-react";
import { toast } from "sonner";
import { LoreHeroHeader, LoreSection, LoreChronicle, LoreOrnamentDivider, RuneTag, NPCStatBar } from "../ui";

interface NPCCreatorProps {
  campaignId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function NPCCreator({ campaignId, onSave, onCancel }: NPCCreatorProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  
  // NPC-specific fields
  const [race, setRace] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const [cr, setCr] = useState("");
  const [statBlockUrl, setStatBlockUrl] = useState("");
  const [homeRegion, setHomeRegion] = useState("");
  const [traits, setTraits] = useState("");
  const [ideals, setIdeals] = useState("");
  const [bonds, setBonds] = useState("");
  const [flaws, setFlaws] = useState("");
  const [voice, setVoice] = useState("");
  const [secrets, setSecrets] = useState("");
  
  const [regions, setRegions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  useEffect(() => {
    loadRegions();
  }, [campaignId]);

  useEffect(() => {
    if (title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [title]);

  const loadRegions = async () => {
    const { data } = await supabase
      .from("lore_pages")
      .select("id, title")
      .eq("campaign_id", campaignId)
      .eq("category", "regions");
    if (data) setRegions(data);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!race.trim()) {
      toast.error("Race/Species is required");
      return;
    }
    if (cr && parseFloat(cr) < 0) {
      toast.error("CR must be >= 0");
      return;
    }

    setSaving(true);
    try {
      const details = {
        race,
        age,
        gender,
        role,
        cr: cr ? parseFloat(cr) : null,
        statBlockUrl,
        homeRegionId: homeRegion || null,
        personality: { traits, ideals, bonds, flaws },
        voice,
        secrets
      };

      const { error } = await supabase.from("lore_pages").insert({
        campaign_id: campaignId,
        title,
        slug,
        content_md: content,
        excerpt: summary,
        tags,
        category: "npcs",
        visibility,
        details
      });

      if (error) throw error;
      toast.success("NPC created successfully");
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

  const homeRegionName = regions.find(r => r.id === homeRegion)?.title;

  return (
    <ScrollArea className="h-[calc(90vh-12rem)]">
      <div className="lore-form-container space-y-6 pb-6 pr-4">
        {/* Hero Header */}
        <LoreHeroHeader
          title={title}
          category="npcs"
          visibility={visibility}
          slug={slug}
          subtitle={role ? `${role}${race ? ` • ${race}` : ''}` : race}
        >
          <NPCStatBar
            race={race}
            age={age}
            role={role}
            cr={cr}
            homeRegion={homeRegionName}
          />
        </LoreHeroHeader>

        {/* Identity Section */}
        <LoreSection title="Identity" icon={User} accentClass="lore-accent-npcs">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Name *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Garrick Ironforge"
                className="bg-card/50 border-brass/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="race">Race/Species *</Label>
              <Input
                id="race"
                value={race}
                onChange={(e) => setRace(e.target.value)}
                placeholder="Dwarf"
                className="bg-card/50 border-brass/20"
              />
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

          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="150"
                className="bg-card/50 border-brass/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender/Pronouns</Label>
              <Input
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="He/Him"
                className="bg-card/50 border-brass/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Occupation/Role</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Blacksmith"
                className="bg-card/50 border-brass/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr">CR</Label>
              <Input
                id="cr"
                type="number"
                value={cr}
                onChange={(e) => setCr(e.target.value)}
                placeholder="5"
                min="0"
                className="bg-card/50 border-brass/20"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="homeRegion">Home Region</Label>
              <Select value={homeRegion} onValueChange={setHomeRegion}>
                <SelectTrigger className="bg-card/50 border-brass/20">
                  <SelectValue placeholder="Select home region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="space-y-2">
              <Label htmlFor="statBlockUrl">Stat Block Link</Label>
              <Input
                id="statBlockUrl"
                value={statBlockUrl}
                onChange={(e) => setStatBlockUrl(e.target.value)}
                placeholder="https://..."
                className="bg-card/50 border-brass/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (press Enter to add)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="merchant, ally"
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

        {/* Personality Section */}
        <LoreSection title="Personality" icon={Heart} accentClass="lore-accent-npcs">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Traits</Label>
              <Input 
                value={traits} 
                onChange={(e) => setTraits(e.target.value)} 
                placeholder="Gruff but kind" 
                className="bg-card/50 border-brass/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Ideals</Label>
              <Input 
                value={ideals} 
                onChange={(e) => setIdeals(e.target.value)} 
                placeholder="Honor, Craftsmanship" 
                className="bg-card/50 border-brass/20"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bonds</Label>
              <Input 
                value={bonds} 
                onChange={(e) => setBonds(e.target.value)} 
                placeholder="Family forge" 
                className="bg-card/50 border-brass/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Flaws</Label>
              <Input 
                value={flaws} 
                onChange={(e) => setFlaws(e.target.value)} 
                placeholder="Stubborn" 
                className="bg-card/50 border-brass/20"
              />
            </div>
          </div>
        </LoreSection>

        {/* Voice & Manner Section */}
        <LoreSection title="Voice & Manner" icon={Mic} accentClass="lore-accent-npcs">
          <div className="space-y-2">
            <Label>Voice & Quirks</Label>
            <Textarea
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              placeholder="Deep voice, often hums while working..."
              rows={3}
              className="bg-card/50 border-brass/20"
            />
          </div>
        </LoreSection>

        {/* Secrets Section */}
        <LoreSection title="Secrets (DM Only)" icon={Lock} accentClass="lore-accent-npcs">
          <Textarea
            value={secrets}
            onChange={(e) => setSecrets(e.target.value)}
            placeholder="Hidden information, plot hooks..."
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
          label="Biography"
        />

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-brass/20">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save NPC"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
