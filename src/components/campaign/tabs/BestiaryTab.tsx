import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Flame, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoMonsters } from "@/lib/demoAdapters";
import { BestiarySourceToggle } from "@/components/bestiary/BestiarySourceToggle";
import { MonsterCard, UnifiedMonster } from "@/components/bestiary/MonsterCard";
import { MonsterDetailDialog } from "@/components/bestiary/MonsterDetailDialog";
import { MonsterWizard } from "@/components/bestiary/MonsterWizard";
import { MonsterFormData, getDefaultFormData, MonsterAction } from "@/hooks/useMonsterForm";

interface BestiaryTabProps {
  demoMode?: boolean;
  demoCampaign?: DemoCampaign | null;
  campaignId?: string;
}

export function BestiaryTab({ demoMode, demoCampaign, campaignId }: BestiaryTabProps) {
  const [catalogMonsters, setCatalogMonsters] = useState<UnifiedMonster[]>([]);
  const [homebrewMonsters, setHomebrewMonsters] = useState<UnifiedMonster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [crRange, setCrRange] = useState([0, 30]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCompendium, setShowCompendium] = useState(true);
  const [showHomebrew, setShowHomebrew] = useState(true);

  // Dialog states
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<Partial<MonsterFormData> | undefined>();
  const [wizardEditId, setWizardEditId] = useState<string | undefined>();
  const [detailMonster, setDetailMonster] = useState<UnifiedMonster | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnifiedMonster | null>(null);

  useEffect(() => { fetchMonsters(); }, [demoMode, demoCampaign]);

  const fetchMonsters = async () => {
    setLoading(true);
    try {
      if (demoMode && demoCampaign) {
        const adapted = adaptDemoMonsters(demoCampaign);
        setCatalogMonsters((adapted as any[]).map(m => ({ ...m, source: "catalog" as const })));
        setLoading(false);
        return;
      }

      const [catalogRes, homebrewRes] = await Promise.all([
        supabase.from("monster_catalog").select("*").order("name"),
        supabase.from("monster_homebrew").select("*").order("name"),
      ]);

      if (catalogRes.error) throw catalogRes.error;
      if (homebrewRes.error) throw homebrewRes.error;

      setCatalogMonsters((catalogRes.data || []).map(m => ({ ...m, source: "catalog" as const })));
      setHomebrewMonsters((homebrewRes.data || []).map(m => ({ ...m, source: "homebrew" as const })));
    } catch (error: any) {
      console.error("Error fetching monsters:", error);
      toast.error("Failed to load bestiary");
    } finally {
      setLoading(false);
    }
  };

  const allMonsters = useMemo(() => {
    const result: UnifiedMonster[] = [];
    if (showCompendium) result.push(...catalogMonsters);
    if (showHomebrew) result.push(...homebrewMonsters);
    return result;
  }, [showCompendium, showHomebrew, catalogMonsters, homebrewMonsters]);

  const filteredMonsters = useMemo(() => {
    return allMonsters.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCR = m.cr == null || (m.cr >= crRange[0] && m.cr <= crRange[1]);
      const matchesType = typeFilter === "all" || m.type === typeFilter;
      return matchesSearch && matchesCR && matchesType;
    });
  }, [allMonsters, searchQuery, crRange, typeFilter]);

  const types = useMemo(() => Array.from(new Set(allMonsters.map(m => m.type).filter(Boolean))).sort(), [allMonsters]);

  const handleCreateMonster = () => {
    setWizardInitialData(undefined);
    setWizardEditId(undefined);
    setWizardOpen(true);
  };

  const handleDuplicate = (monster: UnifiedMonster) => {
    const actionsToParse = (list: any[], category: MonsterAction["category"]): MonsterAction[] =>
      (list || []).map((a: any, i: number) => ({
        id: String(i),
        name: a.name || "",
        description: a.description || "",
        category,
        attackBonus: a.attack_bonus,
        reach: a.reach,
        damageDice: a.damage_dice,
        damageType: a.damage_type,
        recharge: a.recharge,
      }));

    const abilities = monster.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const saves = monster.saves || {};

    const initial: Partial<MonsterFormData> = {
      name: `${monster.name} (Copy)`,
      startType: "existing",
      size: typeof monster.size === "string" ? monster.size.charAt(0).toUpperCase() + monster.size.slice(1) : "Medium",
      type: monster.type,
      alignment: monster.alignment || "",
      cr: monster.cr ?? 1,
      ac: monster.ac,
      hpAvg: monster.hp_avg,
      hpFormula: monster.hp_formula || "",
      speeds: { walk: 30, fly: 0, swim: 0, climb: 0, burrow: 0, ...(monster.speed || {}) },
      abilities,
      saveProficiencies: { str: !!saves.str, dex: !!saves.dex, con: !!saves.con, int: !!saves.int, wis: !!saves.wis, cha: !!saves.cha },
      skills: monster.skills || {},
      senses: monster.senses || {},
      languages: monster.languages || "",
      resistances: monster.resistances || [],
      immunities: monster.immunities || [],
      vulnerabilities: monster.vulnerabilities || [],
      conditionImmunities: monster.condition_immunities || [],
      traits: monster.traits || [],
      actions: [
        ...actionsToParse(monster.actions, "action"),
        ...actionsToParse(monster.bonus_actions, "bonus_action"),
        ...actionsToParse(monster.reactions, "reaction"),
        ...actionsToParse(monster.legendary_actions, "legendary"),
        ...actionsToParse(monster.lair_actions, "lair"),
      ],
      tags: monster.tags || [],
      derivedFromMonsterId: monster.id,
      derivedFromSource: monster.source,
      proficiencyBonus: monster.proficiency_bonus || 2,
    };
    setWizardInitialData(initial);
    setWizardEditId(undefined);
    setWizardOpen(true);
  };

  const handleEdit = (monster: UnifiedMonster) => {
    // Same as duplicate but sets editId
    handleDuplicate(monster);
    // Override name (no " (Copy)")
    setWizardInitialData(prev => prev ? { ...prev, name: monster.name, derivedFromMonsterId: monster.derived_from_monster_id, derivedFromSource: monster.derived_from_source } : prev);
    setWizardEditId(monster.id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("monster_homebrew").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Monster deleted");
      setDeleteTarget(null);
      fetchMonsters();
    } catch (err: any) {
      toast.error("Failed to delete monster");
    }
  };

  return (
    <div className="space-y-4">
      <BestiarySourceToggle
        showCompendium={showCompendium}
        showHomebrew={showHomebrew}
        onToggleCompendium={setShowCompendium}
        onToggleHomebrew={setShowHomebrew}
        onCreateMonster={handleCreateMonster}
      />

      {/* Filters */}
      <Card className="bg-card/50 border-brass/20">
        <CardContent className="pt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brass" />
            <Input placeholder="Search monsters..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-background/50 border-brass/30" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-background/50 border-brass/30 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">CR: {crRange[0]} – {crRange[1]}</label>
              <Slider value={crRange} onValueChange={setCrRange} min={0} max={30} step={1} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : filteredMonsters.length === 0 ? (
        <Card className="border-dashed border-2 border-brass/30 bg-card/30">
          <CardContent className="py-16">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-brass/10 p-4 mb-4">
                <Flame className="w-10 h-10 text-brass/60" />
              </div>
              <h3 className="font-cinzel text-lg font-semibold mb-2">No Monsters Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {!showCompendium && !showHomebrew
                  ? "Both sources are hidden. Toggle Compendium or Homebrew to see monsters."
                  : searchQuery || typeFilter !== "all"
                    ? "No monsters match your filters."
                    : "No monsters available."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-450px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {filteredMonsters.map(m => (
              <MonsterCard
                key={`${m.source}-${m.id}`}
                monster={m}
                onView={setDetailMonster}
                onDuplicate={handleDuplicate}
                onEdit={m.source === "homebrew" ? handleEdit : undefined}
                onDelete={m.source === "homebrew" ? setDeleteTarget : undefined}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialogs */}
      <MonsterDetailDialog open={!!detailMonster} onOpenChange={open => { if (!open) setDetailMonster(null); }} monster={detailMonster} />

      <MonsterWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        initialData={wizardInitialData}
        editId={wizardEditId}
        campaignId={campaignId}
        onSaved={fetchMonsters}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="fantasy-border-ornaments bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cinzel">Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. The monster will be permanently removed from your homebrew collection.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
