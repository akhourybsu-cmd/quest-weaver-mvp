import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getCharacterClasses,
  type CharacterClassEntry,
} from "@/lib/character/classes";

interface ClassLineupBadgeProps {
  /** Pre-loaded class lineup. If omitted, pass `characterId` to fetch. */
  classes?: Pick<CharacterClassEntry, "className" | "level" | "isPrimary">[];
  /** Used only when `classes` is not provided. */
  characterId?: string;
  /** Legacy fallback: shown as a single pill if no lineup is available. */
  fallbackClass?: string | null;
  fallbackLevel?: number | null;
  /** Show "Total N" trailing chip on multiclass. Defaults to true. */
  showTotal?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Renders a character's class lineup as pill badges:
 *   [ Fighter 3 ] [ Wizard 2 ]  Total 5
 *
 * Primary class is rendered first with a brass accent. On a single class,
 * the "Total" chip is hidden.
 */
export function ClassLineupBadge({
  classes,
  characterId,
  fallbackClass,
  fallbackLevel,
  showTotal = true,
  size = "md",
  className,
}: ClassLineupBadgeProps) {
  const [fetched, setFetched] = useState<CharacterClassEntry[] | null>(null);

  useEffect(() => {
    if (classes || !characterId) return;
    let cancelled = false;
    getCharacterClasses(characterId)
      .then((r) => {
        if (!cancelled) setFetched(r.classes);
      })
      .catch(() => {
        if (!cancelled) setFetched([]);
      });
    return () => {
      cancelled = true;
    };
  }, [classes, characterId]);

  const lineup = classes ?? fetched ?? [];

  // Legacy single-class fallback
  if (lineup.length === 0) {
    if (!fallbackClass && !fallbackLevel) return null;
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        <ClassPill
          label={`${fallbackClass ?? "—"} ${fallbackLevel ?? 1}`}
          primary
          size={size}
        />
      </div>
    );
  }

  const sorted = [...lineup].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  );
  const total = sorted.reduce((s, c) => s + c.level, 0);
  const isMulti = sorted.length > 1;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {sorted.map((c) => (
        <ClassPill
          key={`${c.className}-${c.isPrimary}`}
          label={`${c.className} ${c.level}`}
          primary={c.isPrimary}
          size={size}
        />
      ))}
      {isMulti && showTotal && (
        <span
          className={cn(
            "font-cinzel tracking-wider text-muted-foreground",
            size === "sm" ? "text-[10px]" : "text-xs",
          )}
        >
          Total {total}
        </span>
      )}
    </div>
  );
}

function ClassPill({
  label,
  primary,
  size,
}: {
  label: string;
  primary: boolean;
  size: "sm" | "md";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-cinzel tracking-wide rounded-md",
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        primary
          ? "border-brass/60 text-brass bg-brass/5"
          : "border-muted-foreground/40 text-foreground/80 bg-background/40",
      )}
    >
      {label}
    </Badge>
  );
}