import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2, TrendingUp, Eye, Wand2, Sparkles, Moon, Sun,
  Shield, Target, Leaf, Music, Flame, Zap, Sword, BookOpen,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { LevelUpWizard } from "./LevelUpWizard";
import { CLASS_LEVEL_UP_RULES } from "@/lib/rules/levelUpRules";

// ── Class visual metadata ────────────────────────────────────────────────────

type ClassMeta = {
  Icon: React.ComponentType<{ className?: string }>;
  hue: number;       // HSL hue for the banner gradient
  sat: number;       // saturation %
};

const CLASS_META: Record<string, ClassMeta> = {
  fighter:   { Icon: Sword,    hue: 0,   sat: 55 },
  wizard:    { Icon: Wand2,    hue: 270, sat: 60 },
  sorcerer:  { Icon: Sparkles, hue: 280, sat: 65 },
  warlock:   { Icon: Moon,     hue: 258, sat: 55 },
  cleric:    { Icon: Sun,      hue: 42,  sat: 60 },
  paladin:   { Icon: Shield,   hue: 42,  sat: 50 },
  rogue:     { Icon: Eye,      hue: 150, sat: 28 },
  ranger:    { Icon: Target,   hue: 140, sat: 45 },
  druid:     { Icon: Leaf,     hue: 100, sat: 40 },
  bard:      { Icon: Music,    hue: 175, sat: 50 },
  barbarian: { Icon: Flame,    hue: 20,  sat: 65 },
  monk:      { Icon: Zap,      hue: 200, sat: 55 },
};

const DEFAULT_META: ClassMeta = { Icon: BookOpen, hue: 35, sat: 36 };

function getClassMeta(cls: string): ClassMeta {
  return CLASS_META[cls?.toLowerCase()] ?? DEFAULT_META;
}

function hpFillClass(pct: number): string {
  if (pct > 50) return "fantasy-hp-fill";
  if (pct > 25) return "fantasy-hp-fill-warn";
  return "fantasy-hp-fill-crit";
}

// ── Component ────────────────────────────────────────────────────────────────

interface CharacterCardProps {
  character: {
    id: string;
    name: string;
    class: string;
    level: number;
    max_hp: number;
    current_hp: number;
    ac: number;
    temp_hp?: number;
    creation_status?: "draft" | "complete";
    subclass_name?: string | null;
  };
  campaignId: string;
  onResumeCreation?: (characterId: string) => void;
  onDelete?: () => void;
  onRefresh?: () => void;
}

const CharacterCard = ({
  character,
  campaignId,
  onResumeCreation,
  onDelete,
  onRefresh,
}: CharacterCardProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const isIncomplete = character.creation_status === "draft";
  const hpPct = character.max_hp > 0
    ? Math.max(0, Math.min(100, (character.current_hp / character.max_hp) * 100))
    : 0;

  const classRules = CLASS_LEVEL_UP_RULES[character.class];
  const subclassLevel = classRules?.subclassLevel ?? 3;

  const { Icon: ClassIcon, hue, sat } = getClassMeta(character.class);

  // Banner gradient derived from class hue — adapts visually to both light + dark themes
  const bannerBg = `linear-gradient(135deg, hsl(${hue} ${sat}% 18%) 0%, hsl(${hue} ${sat - 8}% 13%) 100%)`;
  const iconBg   = `hsl(${hue} ${sat}% 26% / 0.55)`;
  const levelBg  = `hsl(${hue} ${sat}% 20% / 0.65)`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("characters")
        .delete()
        .eq("id", character.id);
      if (error) throw error;
      toast.success("Character deleted");
      setShowDeleteDialog(false);
      onDelete?.();
    } catch (err: any) {
      console.error("Error deleting character:", err);
      toast.error("Failed to delete character: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="fantasy-character-card overflow-hidden group p-0">
      {/* ── Class banner ───────────────────────────────────────────── */}
      <div
        className="relative h-[60px] flex items-center px-4 select-none"
        style={{ background: bannerBg }}
      >
        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")",
          }}
        />
        {/* Bottom shimmer edge */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/70 to-transparent" />

        {/* Class icon + identity */}
        <div className="relative flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-1 ring-brass/35"
            style={{ background: iconBg }}
          >
            <ClassIcon className="h-4 w-4 text-brass/85" />
          </div>
          <div className="min-w-0">
            <p className="font-cinzel text-[9px] tracking-[0.25em] uppercase text-white/45 leading-none mb-0.5">
              {isIncomplete ? "In Progress" : "Adventurer"}
            </p>
            <p className="font-cinzel text-[11px] tracking-wider text-white/75 leading-none truncate">
              {character.class}
              {character.subclass_name && (
                <span className="text-white/45"> · {character.subclass_name}</span>
              )}
            </p>
          </div>
        </div>

        {/* Level medallion */}
        <div
          className="w-9 h-9 rounded-full flex flex-col items-center justify-center shrink-0 border border-brass/45 shadow-inner"
          style={{ background: levelBg }}
        >
          <span className="font-cinzel font-bold text-sm leading-none text-brass/90">
            {character.level}
          </span>
          <span className="font-cinzel text-[8px] leading-none text-white/40 tracking-wider uppercase mt-0.5">
            lvl
          </span>
        </div>
      </div>

      {/* ── Card body ──────────────────────────────────────────────── */}
      <CardContent className="px-4 pt-3.5 pb-4 space-y-3">

        {/* Name + badges */}
        <div>
          <h3 className="font-cinzel font-bold text-base leading-snug truncate text-foreground">
            {character.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            {isIncomplete && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 border-amber-500/50 text-amber-500 font-cinzel tracking-wide"
              >
                Draft
              </Badge>
            )}
            {!isIncomplete && character.level >= subclassLevel && !character.subclass_name && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 border-brass/50 text-brass font-cinzel tracking-wide"
              >
                Subclass Available
              </Badge>
            )}
          </div>
        </div>

        {/* HP bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-cinzel text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
              HP
            </span>
            <span className="font-cinzel text-[11px] tabular-nums text-foreground">
              {character.current_hp}
              <span className="text-muted-foreground">/{character.max_hp}</span>
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden fantasy-hp-track-embedded">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${hpFillClass(hpPct)}`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          {(character.temp_hp ?? 0) > 0 && (
            <p className="font-cinzel text-[9px] tracking-wide text-primary uppercase">
              +{character.temp_hp} temp
            </p>
          )}
        </div>

        {/* AC pill */}
        <div className="flex items-center gap-2 rounded-md py-1.5 px-2.5 bg-muted/40 border border-border/50">
          <Shield className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="font-cinzel text-[9px] tracking-[0.2em] uppercase text-muted-foreground flex-1">
            Armor Class
          </span>
          <span className="font-cinzel font-bold text-sm text-foreground tabular-nums">
            {character.ac}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {isIncomplete ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 font-cinzel text-[10px] tracking-widest uppercase border-amber-500/40 text-amber-600 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onResumeCreation?.(character.id);
              }}
            >
              Continue Creation
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 font-cinzel text-[10px] tracking-widest uppercase border-brass/25 hover:border-brass/50 hover:bg-brass/10 hover:text-brass transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/campaign/${campaignId}/character/${character.id}`);
                }}
              >
                View Sheet
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Level Up"
                className="h-8 px-2.5 fantasy-level-up-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLevelUp(true);
                }}
              >
                <TrendingUp className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>

      {/* ── Level Up Wizard ────────────────────────────────────────── */}
      <LevelUpWizard
        key={character.level}
        open={showLevelUp}
        onOpenChange={setShowLevelUp}
        characterId={character.id}
        currentLevel={character.level}
        onComplete={() =>
          onRefresh ? onRefresh() : onDelete ? onDelete() : window.location.reload()
        }
      />

      {/* ── Delete confirmation ────────────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cinzel">
              Delete {character.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{character.name}</strong> and
              all their records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting…" : "Delete Forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CharacterCard;
