import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

interface WikilinkAutocompleteProps {
  campaignId: string;
  searchText: string;
  position: { top: number; left: number };
  onSelect: (noteTitle: string) => void;
  onClose: () => void;
}

interface NoteOption {
  id: string;
  title: string;
  folder: string | null;
}

const WikilinkAutocomplete = ({
  campaignId,
  searchText,
  position,
  onSelect,
  onClose,
}: WikilinkAutocompleteProps) => {
  const [options, setOptions] = useState<NoteOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOptions(searchText);
  }, [searchText, campaignId]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [options]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (options[selectedIndex]) {
          onSelect(options[selectedIndex].title);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, selectedIndex, onSelect, onClose]);

  const loadOptions = async (search: string) => {
    const query = supabase
      .from("session_notes")
      .select("id, title, folder")
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (search.trim()) {
      query.ilike("title", `%${search}%`);
    }

    const { data } = await query;
    setOptions((data as NoteOption[]) || []);
  };

  if (options.length === 0 && !searchText.trim()) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[100] w-72 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {options.length === 0 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No notes found. Link will be created as a reference.
        </div>
      ) : (
        options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.title)}
            className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors ${
              index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            }`}
          >
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="truncate">{option.title}</span>
              {option.folder && (
                <span className="text-xs text-muted-foreground truncate">
                  {option.folder}
                </span>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
};

export default WikilinkAutocomplete;
