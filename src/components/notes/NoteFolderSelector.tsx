import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FolderOpen, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteFolderSelectorProps {
  campaignId: string;
  value: string | null;
  onChange: (folder: string | null) => void;
  className?: string;
}

const NoteFolderSelector = ({ campaignId, value, onChange, className }: NoteFolderSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    loadFolders();
  }, [campaignId]);

  const loadFolders = async () => {
    const { data } = await supabase
      .from("session_notes")
      .select("folder")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null)
      .not("folder", "is", null);

    if (data) {
      const uniqueFolders = [...new Set(data.map((d: any) => d.folder as string).filter(Boolean))];
      setFolders(uniqueFolders.sort());
    }
  };

  const handleSelect = (folder: string) => {
    onChange(folder);
    setOpen(false);
    setInputValue("");
  };

  const handleCreateNew = () => {
    if (inputValue.trim()) {
      onChange(inputValue.trim());
      setOpen(false);
      setInputValue("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("justify-start gap-2 font-normal", className)}
        >
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
          {value ? (
            <span className="flex items-center gap-1.5">
              {value}
              <X
                className="w-3 h-3 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              />
            </span>
          ) : (
            <span className="text-muted-foreground">Notebook...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or create notebook..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() ? (
                <button
                  onClick={handleCreateNew}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  Create "{inputValue.trim()}"
                </button>
              ) : (
                <p className="text-sm text-muted-foreground p-2">No notebooks yet</p>
              )}
            </CommandEmpty>

            {folders.length > 0 && (
              <CommandGroup heading="Notebooks">
                {folders.map((folder) => (
                  <CommandItem
                    key={folder}
                    value={folder}
                    onSelect={() => handleSelect(folder)}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {folder}
                    {value === folder && <Check className="w-4 h-4 ml-auto" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {inputValue.trim() && !folders.includes(inputValue.trim()) && folders.length > 0 && (
              <CommandGroup heading="Create New">
                <CommandItem onSelect={handleCreateNew}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Create "{inputValue.trim()}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default NoteFolderSelector;
