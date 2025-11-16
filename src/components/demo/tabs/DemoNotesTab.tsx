import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoNotes } from "@/lib/demoAdapters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Pin, Eye, EyeOff } from "lucide-react";

interface DemoNotesTabProps {
  campaign: DemoCampaign;
}

export function DemoNotesTab({ campaign }: DemoNotesTabProps) {
  const notes = adaptDemoNotes(campaign);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold">Notes</h2>
          <p className="text-muted-foreground">Campaign notes and observations</p>
        </div>
      </div>

      <div className="grid gap-4">
        {notes.map((note) => (
          <Card key={note.id} className="bg-card/50 border-brass/20 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="font-cinzel flex items-center gap-2">
                    <FileText className="w-5 h-5 text-arcanePurple" />
                    {note.title}
                    {note.is_pinned && <Pin className="w-4 h-4 text-brass" />}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="border-brass/50 text-brass">
                  {note.visibility === "DM_ONLY" ? (
                    <span className="flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      DM Only
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Shared
                    </span>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content_markdown}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
