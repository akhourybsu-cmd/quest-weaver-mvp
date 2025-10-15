import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Code, Save, X } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LoreEditorProps {
  campaignId: string;
  page: any | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function LoreEditor({ campaignId, page, onSave, onCancel }: LoreEditorProps) {
  const [title, setTitle] = useState(page?.title || "");
  const [slug, setSlug] = useState(page?.slug || "");
  const [content, setContent] = useState(page?.content_md || "");
  const [excerpt, setExcerpt] = useState(page?.excerpt || "");
  const [tags, setTags] = useState<string[]>(page?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<'DM_ONLY' | 'SHARED' | 'PUBLIC'>(page?.visibility || 'DM_ONLY');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Auto-generate slug from title
  useEffect(() => {
    if (!page && title) {
      const autoSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(autoSlug);
    }
  }, [title, page]);

  // Autosave
  useEffect(() => {
    if (!page || !title || !content) return;
    
    const timeoutId = setTimeout(() => {
      handleSave(true);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [title, content, excerpt, tags, visibility]);

  const parseLinks = (markdown: string): { type: string; label: string; id?: string }[] => {
    const links: { type: string; label: string; id?: string }[] = [];
    
    // [[Page Title]] - lore page links
    const pageLinks = markdown.matchAll(/\[\[([^\]]+)\]\]/g);
    for (const match of pageLinks) {
      links.push({ type: 'LORE', label: match[1] });
    }
    
    // @NPC, #Location, %Faction, !Quest, $Item
    const entityPatterns = [
      { regex: /@([a-zA-Z0-9\s]+)/g, type: 'NPC' },
      { regex: /#([a-zA-Z0-9\s]+)/g, type: 'LOCATION' },
      { regex: /%([a-zA-Z0-9\s]+)/g, type: 'FACTION' },
      { regex: /!([a-zA-Z0-9\s]+)/g, type: 'QUEST' },
      { regex: /\$([a-zA-Z0-9\s]+)/g, type: 'ITEM' }
    ];
    
    for (const pattern of entityPatterns) {
      const matches = markdown.matchAll(pattern.regex);
      for (const match of matches) {
        links.push({ type: pattern.type, label: match[1].trim() });
      }
    }
    
    return links;
  };

  const handleSave = async (isAutosave = false) => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      if (!isAutosave) {
        toast.error("Title, slug, and content are required");
      }
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const pageData = {
        campaign_id: campaignId,
        title: title.trim(),
        slug: slug.trim(),
        content_md: content,
        excerpt: excerpt.trim() || null,
        tags,
        visibility,
        author_id: user.id
      };

      let pageId = page?.id;

      if (page) {
        const { error } = await supabase
          .from("lore_pages")
          .update(pageData)
          .eq("id", page.id);
        if (error) throw error;
      } else {
        const { data: newPage, error } = await supabase
          .from("lore_pages")
          .insert(pageData)
          .select()
          .single();
        if (error) throw error;
        pageId = newPage.id;
      }

      // Parse and save links
      const links = parseLinks(content);
      
      // Delete existing links
      await supabase
        .from("lore_links")
        .delete()
        .eq("source_page", pageId);

      // Insert new links
      if (links.length > 0) {
        const linkRecords = links.map(link => ({
          campaign_id: campaignId,
          source_page: pageId,
          target_type: link.type,
          target_id: link.id || null,
          label: link.label
        }));

        await supabase
          .from("lore_links")
          .insert(linkRecords);
      }

      if (!isAutosave) {
        toast.success("Page saved successfully");
        onSave();
      }
    } catch (error: any) {
      if (!isAutosave) {
        toast.error("Failed to save page: " + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="page-slug"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="excerpt">Excerpt (optional)</Label>
          <Input
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary for cards"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DM_ONLY">DM Only</SelectItem>
                <SelectItem value="SHARED">Shared with Players</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag"
              />
              <Button type="button" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="flex-1">
              <Code className="h-4 w-4 mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="flex-1 m-0 p-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your lore in Markdown...

Use [[Page Title]] to link pages
Use @NPC, #Location, %Faction, !Quest, $Item to link entities"
            className="h-full min-h-[400px] font-mono"
          />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || "*No content to preview*"}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="p-4 border-t flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {saving ? "Saving..." : "Autosave enabled"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
