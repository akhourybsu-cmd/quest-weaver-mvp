import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Swords, Backpack } from "lucide-react";
import { toast } from "sonner";
import { useCampaign } from "@/contexts/CampaignContext";
import type { CanonicalEntity } from "@/lib/rules/cacheAdapter";
import {
  listMyCharacters,
  listCampaignEncounters,
  addCreatureToEncounter,
  addItemToCharacter,
  type TargetOption,
} from "@/lib/rules/libraryActions";

/**
 * "Add to…" actions for a library entity (item 5a/5b):
 *   - creature  → an encounter in the current campaign (DM)
 *   - magic_item / equipment → one of the user's characters
 * Spell→character is intentionally absent (needs the 5c migration).
 */
export default function LibraryAddActions({ entity }: { entity: CanonicalEntity }) {
  const { campaign, role } = useCampaign();
  const isCreature = entity.contentType === "creature";
  const isItem = entity.contentType === "magic_item" || entity.contentType === "equipment";

  const [targets, setTargets] = useState<TargetOption[]>([]);
  const [target, setTarget] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Which mode applies?
  const mode: "encounter" | "character" | null = isCreature
    ? "encounter"
    : isItem
    ? "character"
    : null;
  const canEncounter = isCreature && !!campaign && role === "DM";
  const canCharacter = isItem; // characters fetched are the user's own

  useEffect(() => {
    if (!mode) return;
    let cancelled = false;
    setLoading(true);
    setTarget("");
    const fetcher =
      mode === "encounter"
        ? campaign ? listCampaignEncounters(campaign.id) : Promise.resolve([])
        : listMyCharacters(campaign?.id);
    fetcher
      .then((t) => { if (!cancelled) setTargets(t); })
      .catch(() => { if (!cancelled) setTargets([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity.id, mode, campaign?.id]);

  if (!mode) return null;

  const onAdd = async () => {
    if (!target) return;
    setBusy(true);
    try {
      if (mode === "encounter") {
        await addCreatureToEncounter(entity, target);
        toast.success(`${entity.name} added to encounter.`);
      } else {
        await addItemToCharacter(entity, target);
        toast.success(`${entity.name} added to character.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add (check permissions).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-brass/20 space-y-2">
      <p className="fantasy-section-header text-[10px] flex items-center gap-1.5">
        {mode === "encounter" ? <Swords className="h-3.5 w-3.5" /> : <Backpack className="h-3.5 w-3.5" />}
        Add to {mode === "encounter" ? "encounter" : "character"}
      </p>

      {mode === "encounter" && !canEncounter ? (
        <p className="text-xs text-muted-foreground font-cormorant italic">
          {campaign
            ? "Only the campaign's DM can add creatures to an encounter."
            : "Open the Rules Library from within a campaign to add creatures to an encounter."}
        </p>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : targets.length === 0 ? (
        <p className="text-xs text-muted-foreground font-cormorant italic">
          {mode === "encounter"
            ? "No encounters in this campaign yet."
            : "You have no characters" + (campaign ? " in this campaign." : ".")}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue placeholder={`Choose ${mode}…`} />
            </SelectTrigger>
            <SelectContent>
              {targets.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 gap-1.5" disabled={!target || busy} onClick={onAdd}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
