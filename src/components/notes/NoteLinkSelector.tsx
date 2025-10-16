import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Plus, Users, MapPin, ScrollText, User } from "lucide-react";

interface NoteLink {
  id?: string;
  link_type: string;
  link_id: string | null;
  label: string;
}

interface NoteLinkSelectorProps {
  campaignId: string;
  links: NoteLink[];
  onChange: (links: NoteLink[]) => void;
}

const NoteLinkSelector = ({ campaignId, links, onChange }: NoteLinkSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [npcs, setNpcs] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [quests, setQuests] = useState<any[]>([]);

  useEffect(() => {
    loadOptions();
  }, [campaignId]);

  const loadOptions = async () => {
    const [npcsData, charsData, locsData, questsData] = await Promise.all([
      supabase.from("npcs").select("id, name").eq("campaign_id", campaignId),
      supabase.from("characters").select("id, name").eq("campaign_id", campaignId),
      supabase.from("locations").select("id, name").eq("campaign_id", campaignId),
      supabase.from("quests").select("id, title").eq("campaign_id", campaignId),
    ]);

    if (npcsData.data) setNpcs(npcsData.data);
    if (charsData.data) setCharacters(charsData.data);
    if (locsData.data) setLocations(locsData.data);
    if (questsData.data) setQuests(questsData.data);
  };

  const addLink = (type: string, id: string, label: string) => {
    const newLink: NoteLink = {
      link_type: type,
      link_id: id,
      label,
    };
    onChange([...links, newLink]);
    setOpen(false);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case "NPC":
        return <Users className="w-3 h-3" />;
      case "CHARACTER":
        return <User className="w-3 h-3" />;
      case "LOCATION":
        return <MapPin className="w-3 h-3" />;
      case "QUEST":
        return <ScrollText className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {links.map((link, index) => (
          <Badge key={index} variant="secondary" className="gap-1">
            {getLinkIcon(link.link_type)}
            {link.label}
            <button
              onClick={() => removeLink(index)}
              className="ml-1 hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Link to Campaign Entity
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search NPCs, characters, locations, quests..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              
              {npcs.length > 0 && (
                <CommandGroup heading="NPCs">
                  {npcs.map((npc) => (
                    <CommandItem
                      key={npc.id}
                      onSelect={() => addLink("NPC", npc.id, npc.name)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {npc.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {characters.length > 0 && (
                <CommandGroup heading="Characters">
                  {characters.map((char) => (
                    <CommandItem
                      key={char.id}
                      onSelect={() => addLink("CHARACTER", char.id, char.name)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {char.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {locations.length > 0 && (
                <CommandGroup heading="Locations">
                  {locations.map((loc) => (
                    <CommandItem
                      key={loc.id}
                      onSelect={() => addLink("LOCATION", loc.id, loc.name)}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {loc.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {quests.length > 0 && (
                <CommandGroup heading="Quests">
                  {quests.map((quest) => (
                    <CommandItem
                      key={quest.id}
                      onSelect={() => addLink("QUEST", quest.id, quest.title)}
                    >
                      <ScrollText className="w-4 h-4 mr-2" />
                      {quest.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NoteLinkSelector;
