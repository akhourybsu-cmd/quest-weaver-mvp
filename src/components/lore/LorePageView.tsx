import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, X, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LorePageViewProps {
  page: any;
  campaignId: string;
  onEdit?: () => void;
  onClose: () => void;
}

interface Backlink {
  id: string;
  from_type: string;
  from_id: string;
  label: string;
}

export default function LorePageView({ page, campaignId, onEdit, onClose }: LorePageViewProps) {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    loadBacklinks();
    loadLinks();
  }, [page.id]);

  const loadBacklinks = async () => {
    try {
      const { data, error } = await supabase
        .from("lore_backlinks")
        .select("*")
        .eq("page_id", page.id);

      if (error) throw error;
      setBacklinks(data || []);
    } catch (error) {
      console.error("Error loading backlinks:", error);
    }
  };

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("lore_links")
        .select("*")
        .eq("source_page", page.id);

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error("Error loading links:", error);
    }
  };

  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.target_type]) {
      acc[link.target_type] = [];
    }
    acc[link.target_type].push(link);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold">{page.title}</h2>
            <Badge variant="outline">{page.visibility.replace('_', ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Updated {new Date(page.updated_at).toLocaleDateString()}
          </p>
          {page.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {page.tags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {page.content_md}
            </ReactMarkdown>
          </div>

          {Object.keys(groupedLinks).length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Linked Entities</h3>
                {Object.entries(groupedLinks).map(([type, items]) => (
                  <Card key={type}>
                    <CardHeader>
                      <CardTitle className="text-base">{type.replace('_', ' ')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {(items as any[]).map((item: any) => (
                          <Badge key={item.id} variant="outline">
                            {item.label}
                            {item.target_id && <ExternalLink className="h-3 w-3 ml-1" />}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {backlinks.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Referenced By</h3>
                <Card>
                  <CardHeader>
                    <CardDescription>
                      {backlinks.length} {backlinks.length === 1 ? 'reference' : 'references'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {backlinks.map((link) => (
                        <div key={link.id} className="flex items-center gap-2">
                          <Badge variant="secondary">{link.from_type}</Badge>
                          <span className="text-sm">{link.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
