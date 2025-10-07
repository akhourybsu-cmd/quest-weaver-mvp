import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, CheckCircle2, XCircle } from "lucide-react";

interface SaveResult {
  id: string;
  character_id: string;
  roll: number;
  modifier: number;
  total: number;
  success: boolean;
  character?: {
    name: string;
  };
}

interface SaveResultsProps {
  savePromptId: string;
}

const SaveResults = ({ savePromptId }: SaveResultsProps) => {
  const [results, setResults] = useState<SaveResult[]>([]);

  useEffect(() => {
    fetchResults();

    const channel = supabase
      .channel('save-results-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'save_results',
          filter: `save_prompt_id=eq.${savePromptId}`,
        },
        () => fetchResults()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [savePromptId]);

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from("save_results")
      .select(`
        *,
        character:characters(name)
      `)
      .eq("save_prompt_id", savePromptId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching save results:", error);
      return;
    }

    setResults(data || []);
  };

  if (results.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        Waiting for player responses...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((result) => (
        <div
          key={result.id}
          className={`p-2 rounded-md flex items-center justify-between ${
            result.success ? "bg-status-buff/20" : "bg-status-hp/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-status-buff" />
            ) : (
              <XCircle className="w-4 h-4 text-status-hp" />
            )}
            <span className="font-medium text-sm">{result.character?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
              {result.roll} + {result.modifier} = {result.total}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {result.success ? "Success" : "Fail"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SaveResults;
