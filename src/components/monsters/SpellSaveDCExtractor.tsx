import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";

export const SpellSaveDCExtractor = () => {
  const [extracting, setExtracting] = useState(false);
  const { toast } = useToast();

  const handleExtract = async () => {
    try {
      setExtracting(true);
      
      const { data, error } = await supabase.functions.invoke('extract-spell-save-dcs');

      if (error) throw error;

      toast({
        title: "Extraction Complete",
        description: `Processed ${data.processed} monsters, updated ${data.updated} with spell save DCs`,
      });
    } catch (error: any) {
      console.error('Error extracting spell save DCs:', error);
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Extract Spell Save DCs
        </CardTitle>
        <CardDescription className="text-xs">
          Parse all monsters and extract spell save DC information into structured data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleExtract} 
          disabled={extracting}
          size="sm"
          className="w-full"
        >
          {extracting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {extracting ? 'Extracting...' : 'Extract Spell Save DCs'}
        </Button>
      </CardContent>
    </Card>
  );
};
