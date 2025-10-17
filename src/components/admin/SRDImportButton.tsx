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

      setResults(data.results);
      toast({
        title: "SRD Import Complete",
        description: `Successfully imported ${data.summary.totalImported} items across ${data.results.length} categories.`,
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

        {results && (
          <div className="space-y-2">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Import completed successfully! All SRD content is now available.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Import Results:</h4>
              {results.map((result) => (
                <div key={result.entity} className="flex justify-between text-sm">
                  <span className="capitalize">{result.entity}:</span>
                  <span className="text-muted-foreground">
                    {result.imported} imported, {result.skipped} skipped
                    {result.errors.length > 0 && (
                      <span className="text-destructive ml-2">
                        ({result.errors.length} errors)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {results.some(r => r.errors.length > 0) && (
              <details className="border rounded-lg p-4">
                <summary className="font-semibold text-sm cursor-pointer">
                  View Errors
                </summary>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {results.flatMap(r => r.errors).map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              </details>
            )}
          </div>
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
