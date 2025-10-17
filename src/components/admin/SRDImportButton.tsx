import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ImportResult {
  entity: string;
  imported: number;
  skipped: number;
  errors: string[];
}

interface CategoryOption {
  id: string;
  label: string;
  description: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'documents', label: 'Documents', description: 'Metadata & source info' },
  { id: 'languages', label: 'Languages', description: 'Common, Elvish, etc.' },
  { id: 'classes', label: 'Classes', description: 'Fighter, Wizard, etc.' },
  { id: 'ancestries', label: 'Ancestries', description: 'Elf, Dwarf, Human, etc.' },
  { id: 'backgrounds', label: 'Backgrounds', description: 'Acolyte, Soldier, etc.' },
  { id: 'armor', label: 'Armor', description: 'Leather, Chainmail, etc.' },
  { id: 'weapons', label: 'Weapons', description: 'Longsword, Bow, etc.' },
  { id: 'spells', label: 'Spells', description: '1,146 total spells' },
  { id: 'feats', label: 'Feats', description: 'Special abilities' },
  { id: 'conditions', label: 'Conditions', description: 'Poisoned, Stunned, etc.' },
  { id: 'magic_items', label: 'Magic Items', description: 'Wondrous items & artifacts' },
];

export const SRDImportButton = () => {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAll = () => {
    setSelectedCategories(CATEGORIES.map(c => c.id));
  };

  const deselectAll = () => {
    setSelectedCategories([]);
  };

  const handleImport = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "No Categories Selected",
        description: "Please select at least one category to import.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setError(null);
    setResults(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('import-srd-core', {
        body: { categories: selectedCategories },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "SRD Import Started",
        description: data.message || "Import is running in the background.",
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
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>SRD Data Import</CardTitle>
        <CardDescription>
          Select which D&D 5E SRD content to import from Open5e. 
          Data will be permanently stored and available to all users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Select Categories to Import</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                disabled={importing}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAll}
                disabled={importing}
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CATEGORIES.map((category) => (
              <div 
                key={category.id}
                className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                  disabled={importing}
                />
                <div className="space-y-1 flex-1">
                  <Label
                    htmlFor={category.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {selectedCategories.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
            </p>
          )}
        </div>

        {/* Import Button */}
        <Button 
          onClick={handleImport} 
          disabled={importing || selectedCategories.length === 0}
          className="w-full"
          size="lg"
        >
          {importing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing {selectedCategories.length} {selectedCategories.length === 1 ? 'Category' : 'Categories'}...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Import Selected Categories
            </>
          )}
        </Button>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!importing && !error && selectedCategories.length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Ready to import {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'}. 
              The process runs in the background and typically takes 30-60 seconds per category.
            </AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground">
          Tip: Import categories individually or in small groups to avoid timeouts. 
          You can run the import multiple times for different categories.
        </p>
      </CardContent>
    </Card>
  );
};
