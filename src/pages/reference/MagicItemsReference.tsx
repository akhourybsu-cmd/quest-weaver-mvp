import { useState } from "react";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import { useRulesQuery } from "@/lib/rulesApi/useRulesList";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { SimpleMarkdown } from "@/components/reference/SimpleMarkdown";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const RARITY_VARIANT: Record<string, "default" | "outline" | "secondary"> = {
  common: "outline",
  uncommon: "secondary",
  rare: "default",
  "very rare": "default",
  legendary: "default",
  artifact: "default",
};

export default function MagicItemsReference() {
  const [q, setQ] = useState("");
  const { items, meta, loading, error } = useRulesQuery({
    query: q,
    loader: (query) => rulesApiService.getMagicItems({ query: query || undefined, limit: 60 }),
  });
  return (
    <ReferenceShell
      title="Magic Items"
      description="SRD magic items. Tap any item to read its full effect."
      source={meta.source}
      fromCache={meta.fromCache}
      fallbackUsed={meta.fallbackUsed}
      loading={loading}
      error={error}
      empty={!loading && items.length === 0}
      count={items.length}
      toolbar={<Input placeholder="Search magic items (e.g. bag of holding)…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />}
    >
      <Accordion type="single" collapsible className="w-full">
        {items.map((it) => {
          const n = it.normalized_json as any;
          const rarity = (n?.rarity?.name ?? n?.rarity ?? "").toString().toLowerCase();
          const type = n?.type ?? n?.equipment_category?.name ?? "";
          return (
            <AccordionItem key={it.key} value={it.key}>
              <AccordionTrigger className="text-left">
                <span className="flex items-center gap-2 flex-wrap">
                  {it.name}
                  {rarity && (
                    <Badge variant={RARITY_VARIANT[rarity] ?? "outline"} className="text-[10px] capitalize">
                      {rarity}
                    </Badge>
                  )}
                  {type && <span className="text-[11px] text-muted-foreground capitalize">· {String(type)}</span>}
                  {n?.requires_attunement && <Badge variant="outline" className="text-[10px]">attunement</Badge>}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <SimpleMarkdown text={it.full_description || it.short_description} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </ReferenceShell>
  );
}