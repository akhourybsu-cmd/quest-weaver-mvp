import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Upload, X, Trash2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import LoreLinkSelector from "@/components/lore/LoreLinkSelector";
 import { AIGenerateButton } from "@/components/ai/AIGenerateButton";

interface NPC {
  id: string;
  name: string;
  pronouns?: string;
  role_title?: string;
  public_bio?: string;
  gm_notes?: string;
  secrets?: string;
  portrait_url?: string;
  tags: string[];
  status?: string;
  alignment?: string;
  location_id?: string | null;
  faction_id?: string | null;
  lore_page_id?: string | null;
  faction_role?: string | null;
}

interface Location {
  id: string;
  name: string;
}

interface Faction {
  id: string;
  name: string;
}

interface EnhancedNPCEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  npc: NPC | null;
  onSaved: () => void;
}

const EnhancedNPCEditor = ({ open, onOpenChange, campaignId, npc, onSaved }: EnhancedNPCEditorProps) => {
  const [name, setName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [publicBio, setPublicBio] = useState("");
  const [gmNotes, setGmNotes] = useState("");
  const [secrets, setSecrets] = useState("");
  const [portraitUrl, setPortraitUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState("alive");
  const [alignment, setAlignment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [factionId, setFactionId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [lorePageId, setLorePageId] = useState<string | null>(null);
  const [factionRole, setFactionRole] = useState("");
  const { toast } = useToast();

  // Load locations and factions for dropdowns
  useEffect(() => {
    const loadOptions = async () => {
      const [locResult, facResult] = await Promise.all([
        supabase
          .from("locations")
          .select("id, name")
          .eq("campaign_id", campaignId)
          .order("name"),
        supabase
          .from("factions")
          .select("id, name")
          .eq("campaign_id", campaignId)
          .order("name"),
      ]);
      if (locResult.data) setLocations(locResult.data);
      if (facResult.data) setFactions(facResult.data);
    };
    if (open) loadOptions();
  }, [campaignId, open]);

  useEffect(() => {
    if (npc) {
      setName(npc.name);
      setPronouns(npc.pronouns || "");
      setRoleTitle(npc.role_title || "");
      setPublicBio(npc.public_bio || "");
      setGmNotes(npc.gm_notes || "");
      setSecrets(npc.secrets || "");
      setPortraitUrl(npc.portrait_url || "");
      setTags(npc.tags || []);
      setStatus(npc.status || "alive");
      setAlignment(npc.alignment || "");
      setPlayerVisible((npc as any).player_visible || false);
      setLocationId(npc.location_id || null);
      setFactionId(npc.faction_id || null);
      setLorePageId(npc.lore_page_id || null);
      setFactionRole(npc.faction_role || "");
    } else {
      setName("");
      setPronouns("");
      setRoleTitle("");
      setPublicBio("");
      setGmNotes("");
      setSecrets("");
      setPortraitUrl("");
      setTags([]);
      setStatus("alive");
      setAlignment("");
      setPlayerVisible(false);
      setLocationId(null);
      setFactionId(null);
      setLorePageId(null);
      setFactionRole("");
    }
  }, [npc, open]);

  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${campaignId}/${Math.random()}.${fileExt}`;
      const filePath = `campaign-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("maps")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("maps").getPublicUrl(filePath);
      setPortraitUrl(data.publicUrl);

      toast({
        title: "Portrait uploaded",
        description: "Portrait has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the NPC",
        variant: "destructive",
      });
      return;
    }

    try {
      const npcData = {
        campaign_id: campaignId,
        name: name.trim(),
        pronouns: pronouns.trim() || null,
        role_title: roleTitle.trim() || null,
        public_bio: publicBio.trim() || null,
        gm_notes: gmNotes.trim() || null,
        secrets: secrets.trim() || null,
        portrait_url: portraitUrl || null,
        tags,
        status: status || "alive",
        alignment: alignment.trim() || null,
        player_visible: playerVisible,
        location_id: locationId || null,
        faction_id: factionId || null,
        lore_page_id: lorePageId || null,
        faction_role: factionId ? (factionRole.trim() || null) : null,
      };

      if (npc) {
        const { error } = await supabase
          .from("npcs")
          .update(npcData)
          .eq("id", npc.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("npcs").insert(npcData);
        if (error) throw error;
      }

      toast({
        title: npc ? "NPC updated!" : "NPC inscribed!",
        description: `${name} has been ${npc ? "updated" : "etched into the chronicles"}.`,
      });

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving NPC",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!npc) return;

    try {
      const { error } = await supabase
        .from("npcs")
        .delete()
        .eq("id", npc.id);

      if (error) throw error;

      toast({
        title: "NPC deleted",
        description: `${name} has been deleted successfully`,
      });

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error deleting NPC",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{npc ? "Edit NPC" : "New NPC"}</DialogTitle>
           <AIGenerateButton
             campaignId={campaignId}
             assetType="npc"
             getFormValues={() => ({
               name,
               pronouns,
               role: roleTitle,
               public_bio: publicBio,
               gm_notes: gmNotes,
               secrets,
               tags,
               status,
               alignment,
             })}
             onApply={(fields) => {
               if (fields.name) setName(fields.name);
               if (fields.pronouns) setPronouns(fields.pronouns);
               if (fields.role) setRoleTitle(fields.role);
               if (fields.appearance) setPublicBio(prev => prev ? `${prev}\n\n**Appearance:** ${fields.appearance}` : fields.appearance);
               if (fields.personality) setPublicBio(prev => prev ? `${prev}\n\n**Personality:** ${fields.personality}` : fields.personality);
               if (fields.public_bio) setPublicBio(fields.public_bio);
               if (fields.background) setGmNotes(prev => prev ? `${prev}\n\n**Background:** ${fields.background}` : fields.background);
               if (fields.goals) setGmNotes(prev => prev ? `${prev}\n\n**Goals:** ${fields.goals}` : fields.goals);
               if (fields.fears) setGmNotes(prev => prev ? `${prev}\n\n**Fears:** ${fields.fears}` : fields.fears);
               if (fields.gm_notes) setGmNotes(fields.gm_notes);
               if (fields.secrets) setSecrets(fields.secrets);
               if (fields.plot_hooks && Array.isArray(fields.plot_hooks)) {
                 setGmNotes(prev => {
                   const hooks = fields.plot_hooks.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n');
                   return prev ? `${prev}\n\n**Plot Hooks:**\n${hooks}` : `**Plot Hooks:**\n${hooks}`;
                 });
               }
             }}
             className="ml-auto"
           />
        </DialogHeader>

        <div className="space-y-4">
          {/* Portrait */}
          <div className="flex items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={portraitUrl} alt={name} />
              <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="portrait" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-accent">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload Portrait"}
                </div>
                <Input
                  id="portrait"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePortraitUpload}
                  disabled={uploading}
                />
              </Label>
              {portraitUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setPortraitUrl("")}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="NPC name"
              />
            </div>
            <div>
              <Label htmlFor="pronouns">Pronouns</Label>
              <Input
                id="pronouns"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="they/them, she/her, etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Role/Title</Label>
            <Input
              id="role"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Innkeeper, Guard Captain, etc."
            />
          </div>

          {/* Status & Alignment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alive">Alive</SelectItem>
                  <SelectItem value="dead">Dead</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="alignment">Alignment</Label>
              <Select value={alignment} onValueChange={setAlignment}>
                <SelectTrigger id="alignment">
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lawful-good">Lawful Good</SelectItem>
                  <SelectItem value="neutral-good">Neutral Good</SelectItem>
                  <SelectItem value="chaotic-good">Chaotic Good</SelectItem>
                  <SelectItem value="lawful-neutral">Lawful Neutral</SelectItem>
                  <SelectItem value="true-neutral">True Neutral</SelectItem>
                  <SelectItem value="chaotic-neutral">Chaotic Neutral</SelectItem>
                  <SelectItem value="lawful-evil">Lawful Evil</SelectItem>
                  <SelectItem value="neutral-evil">Neutral Evil</SelectItem>
                  <SelectItem value="chaotic-evil">Chaotic Evil</SelectItem>
                </SelectContent>
              </Select>
          </div>

          {/* Location & Faction Links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Select 
                value={locationId || "none"} 
                onValueChange={(v) => setLocationId(v === "none" ? null : v)}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="faction">Faction</Label>
              <Select 
                value={factionId || "none"} 
                onValueChange={(v) => setFactionId(v === "none" ? null : v)}
              >
                <SelectTrigger id="faction">
                  <SelectValue placeholder="Select faction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {factions.map((fac) => (
                    <SelectItem key={fac.id} value={fac.id}>
                      {fac.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Faction Role - conditional on faction selection */}
          {factionId && (
            <div>
              <Label htmlFor="faction-role">Faction Role</Label>
              <Input
                id="faction-role"
                value={factionRole}
                onChange={(e) => setFactionRole(e.target.value)}
                placeholder="e.g. Spymaster, Guild Master, Recruit..."
              />
            </div>
          )}
          </div>

          {/* Lore Link */}
          <LoreLinkSelector
            campaignId={campaignId}
            category="npcs"
            value={lorePageId}
            onChange={setLorePageId}
            label="Linked Lore Entry"
            entityName={name.trim() || undefined}
          />

          {/* Bio */}
          <MarkdownEditor
            value={publicBio}
            onChange={setPublicBio}
            label="Public Bio"
            placeholder="What players can see about this NPC..."
            rows={4}
            showPreview={false}
          />

          {/* GM-Only Fields */}
          <div>
            <Label htmlFor="gm-notes">GM Notes</Label>
            <Textarea
              id="gm-notes"
              value={gmNotes}
              onChange={(e) => setGmNotes(e.target.value)}
              placeholder="Private notes for the DM..."
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label htmlFor="secrets">Secrets</Label>
            <Textarea
              id="secrets"
              value={secrets}
              onChange={(e) => setSecrets(e.target.value)}
              placeholder="Hidden information about this NPC..."
              className="min-h-[60px]"
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type and press Enter..."
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            {npc && (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <div className="flex items-center gap-2 mr-2">
                <Label htmlFor="npc-visible" className="text-sm">Visible to Players</Label>
                <Switch
                  id="npc-visible"
                  checked={playerVisible}
                  onCheckedChange={setPlayerVisible}
                />
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {npc ? "Save Changes" : "Create NPC"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete NPC</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be undone.
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
    </Dialog>
  );
};

export default EnhancedNPCEditor;
