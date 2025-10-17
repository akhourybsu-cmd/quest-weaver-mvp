import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportResult {
  entity: string;
  imported: number;
  skipped: number;
  errors: string[];
}

export const SRDImportButton = () => {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    setResults(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('import-srd-core', {
        body: {},
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "SRD Import Started",
        description: data.message || "Import is running in the background. This may take several minutes.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete SRD Data Import</CardTitle>
        <CardDescription>
          One-time import of ALL D&D 5E SRD content from Open5e including classes, ancestries, 
          backgrounds, spells, weapons, armor, magic items, feats, conditions, planes, lore sections, 
          and monsters. Data will be permanently stored and available to all users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleImport} 
          disabled={importing}
          className="w-full"
          size="lg"
        >
          {importing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing SRD Data...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Import SRD Content
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!importing && !error && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Import started successfully! The process is running in the background and may take several minutes. 
              You can check the backend logs to monitor progress.
            </AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground">
          Note: This comprehensive import may take 1-2 minutes to complete as it fetches data from multiple 
          Open5e endpoints. You only need to run this once. All data will be permanently stored in the 
          database and available to all authenticated users.
        </p>
      </CardContent>
    </Card>
  );
};
