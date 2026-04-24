import { useState } from "react";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import { useRulesQuery } from "@/lib/rulesApi/useRulesList";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { SimpleMarkdown } from "@/components/reference/SimpleMarkdown";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function EquipmentReference() {
  const [q, setQ] = useState("");
  const { items, meta, loading, error } = useRulesQuery({
    query: q,
    loader: (query) => rulesApiService.getEquipment({ query: query || undefined, limit: 60 }),
  });
  return (
    <ReferenceShell
      title="Equipment"
      description="Mundane SRD weapons, armor, gear, tools and packs."
      source={meta.source}
      fromCache={meta.fromCache}
      fallbackUsed={meta.fallbackUsed}
      loading={loading}
      error={error}
      empty={!loading && items.length === 0}
      count={items.length}
      toolbar={<Input placeholder="Search equipment (e.g. longsword, chain mail)…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />}
    >
      <Accordion type="single" collapsible className="w-full">
        {items.map((e) => {
          const n = e.normalized_json as any;
          const cost = n?.cost ? (typeof n.cost === "string" ? n.cost : `${n.cost.quantity} ${n.cost.unit}`) : null;
          const weight = n?.weight ?? n?.weight_lbs;
          const category = n?.category ?? n?.equipment_category?.name ?? n?.equipment_category;
          return (
            <AccordionItem key={e.key} value={e.key}>
              <AccordionTrigger className="text-left">
                <span className="flex items-center gap-2 flex-wrap">
                  {e.name}
                  {category && <Badge variant="outline" className="text-[10px] capitalize">{String(category)}</Badge>}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                  {cost && <span>Cost: {cost}</span>}
                  {weight !== undefined && <span>Weight: {weight} lb</span>}
                  {n?.damage?.damage_dice && <span>Damage: {n.damage.damage_dice} {n.damage.damage_type?.name ?? ""}</span>}
                  {n?.armor_class?.base !== undefined && <span>AC: {n.armor_class.base}</span>}
                </div>
                <SimpleMarkdown text={e.full_description || e.short_description} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </ReferenceShell>
  );
}