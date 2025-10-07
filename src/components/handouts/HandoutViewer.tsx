import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Eye } from "lucide-react";
import HandoutDialog from "./HandoutDialog";

interface Handout {
  id: string;
  title: string;
  contentType: string;
  contentUrl?: string;
  contentText?: string;
  isRevealed: boolean;
}

interface HandoutViewerProps {
  campaignId: string;
  isDM: boolean;
}

const HandoutViewer = ({ campaignId, isDM }: HandoutViewerProps) => {
  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadHandouts = async () => {
      let query = supabase.from("handouts").select("*").eq("campaign_id", campaignId);

      if (!isDM) {
        query = query.eq("is_revealed", true);
      }

      const { data } = await query.order("created_at", { ascending: false });

      if (data) {
        setHandouts(
          data.map((h) => ({
            id: h.id,
            title: h.title,
            contentType: h.content_type,
            contentUrl: h.content_url,
            contentText: h.content_text,
            isRevealed: h.is_revealed,
          }))
        );
      }
    };

    loadHandouts();

    const channel = supabase
      .channel(`handouts:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "handouts",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadHandouts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, isDM]);

  const toggleReveal = async (handoutId: string, currentRevealed: boolean) => {
    await supabase
      .from("handouts")
      .update({ is_revealed: !currentRevealed })
      .eq("id", handoutId);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Handouts
          </CardTitle>
          {isDM && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Handout
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {handouts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No handouts available
          </div>
        ) : (
          <div className="space-y-3">
            {handouts.map((handout) => (
              <div
                key={handout.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{handout.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {handout.contentType}
                    </div>
                  </div>
                  {isDM && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReveal(handout.id, handout.isRevealed)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {handout.isRevealed ? "Hide" : "Reveal"}
                    </Button>
                  )}
                </div>

                {handout.isRevealed && (
                  <div className="mt-3">
                    {handout.contentType === "image" && handout.contentUrl && (
                      <img
                        src={handout.contentUrl}
                        alt={handout.title}
                        className="w-full rounded-lg"
                      />
                    )}
                    {handout.contentType === "text" && handout.contentText && (
                      <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                        {handout.contentText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {isDM && (
        <HandoutDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          campaignId={campaignId}
        />
      )}
    </Card>
  );
};

export default HandoutViewer;
