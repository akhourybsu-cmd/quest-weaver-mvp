import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SavePrompt {
  id: string;
  ability: string;
  dc: number;
  description: string;
  target_scope: string;
  advantage_mode: string;
  half_on_success: boolean;
  expected_responses: number;
  received_responses: number;
  status: string;
  expires_at: string | null;
  created_at: string;
}

interface SavePromptsListProps {
  encounterId: string;
}

const SavePromptsList = ({ encounterId }: SavePromptsListProps) => {
  const [prompts, setPrompts] = useState<SavePrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrompts();

    // Subscribe to prompt changes (encounter-scoped channel with INSERT+UPDATE)
    const channel = supabase
      .channel(`encounter:${encounterId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'save_prompts',
          filter: `encounter_id=eq.${encounterId}`,
        },
        (payload) => {
          setPrompts((prev) => [payload.new as SavePrompt, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'save_prompts',
          filter: `encounter_id=eq.${encounterId}`,
        },
        (payload) => {
          setPrompts((prev) =>
            prev.map((p) => (p.id === payload.new.id ? (payload.new as SavePrompt) : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId]);

  const fetchPrompts = async () => {
    const { data, error } = await supabase
      .from('save_prompts')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching save prompts:', error);
    } else {
      setPrompts(data || []);
    }
    setLoading(false);
  };

  const expirePrompt = async (promptId: string) => {
    const { error } = await supabase
      .from('save_prompts')
      .update({ status: 'expired' })
      .eq('id', promptId);

    if (error) {
      console.error('Error expiring prompt:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      active: "default",
      resolved: "secondary",
      expired: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const getAdvantageText = (mode: string) => {
    switch (mode) {
      case 'advantage':
        return 'w/ Advantage';
      case 'disadvantage':
        return 'w/ Disadvantage';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading save prompts...</div>;
  }

  const activePrompts = prompts.filter(p => p.status === 'active');
  const recentCompleted = prompts.filter(p => p.status !== 'active').slice(0, 3);

  return (
    <div className="space-y-4">
      {activePrompts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Active Save Prompts
          </h3>
          {activePrompts.map((prompt) => {
            const progress = prompt.expected_responses > 0
              ? (prompt.received_responses / prompt.expected_responses) * 100
              : 0;

            return (
              <Card key={prompt.id} className="border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {prompt.ability.toUpperCase()} Save (DC {prompt.dc})
                    </CardTitle>
                    {getStatusBadge(prompt.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2 space-y-2">
                  <p className="text-sm text-muted-foreground">{prompt.description}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{prompt.target_scope} targets</span>
                    {prompt.advantage_mode !== 'normal' && (
                      <>
                        <span>•</span>
                        <span>{getAdvantageText(prompt.advantage_mode)}</span>
                      </>
                    )}
                    {prompt.half_on_success && (
                      <>
                        <span>•</span>
                        <span>Half on success</span>
                      </>
                    )}
                    {prompt.expires_at && (
                      <>
                        <span>•</span>
                        <span>Expires: {new Date(prompt.expires_at).toLocaleTimeString()}</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Responses</span>
                      <span className="font-medium">
                        {prompt.received_responses} / {prompt.expected_responses}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {prompt.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => expirePrompt(prompt.id)}
                      className="w-full"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Expire Prompt
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {recentCompleted.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Recent</h3>
          {recentCompleted.map((prompt) => (
            <div
              key={prompt.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(prompt.status)}
                <span className="text-muted-foreground">
                  {prompt.ability.toUpperCase()} DC {prompt.dc}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({prompt.received_responses}/{prompt.expected_responses})
                </span>
              </div>
              <Badge variant="outline" className="capitalize text-xs">
                {prompt.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {prompts.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No save prompts sent yet
        </div>
      )}
    </div>
  );
};

export default SavePromptsList;