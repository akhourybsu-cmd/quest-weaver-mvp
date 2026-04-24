import { useState, useMemo } from "react";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import { useRulesList } from "@/lib/rulesApi/useRulesList";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { SimpleMarkdown } from "@/components/reference/SimpleMarkdown";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function ClassesReference() {
  const { items, meta, loading, error } = useRulesList({
    loader: () => rulesApiService.getClasses(),
    seedTable: "srd_classes",
    seedAdapter: (rows) => rows.map((r) => ({
      id: r.id, key: r.id, slug: null, name: r.name,
      content_type: "class" as const, source_api: "open5e_v2" as const,
      source_document: "Local seed", ruleset_version: "5e SRD", license_type: "OGL 1.0a",
      short_description: `Hit Die: d${r.hit_die}`,
      full_description: `**Hit Die:** d${r.hit_die}\n\n**Saving Throws:** ${(r.saving_throws || []).join(", ")}`,
      tags: [], raw_json: r, normalized_json: r, last_fetched_at: r.created_at,
    })),
  });
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => items.filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );
  return (
    <ReferenceShell
      title="Classes"
      description="Browse SRD classes and their core features."
      source={meta.source}
      fromCache={meta.fromCache}
      fallbackUsed={meta.fallbackUsed}
      loading={loading}
      error={error}
      empty={!loading && filtered.length === 0}
      count={items.length}
      toolbar={<Input placeholder="Search classes…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />}
    >
      <Accordion type="single" collapsible className="w-full">
        {filtered.map((c) => {
          const features = (c.normalized_json as any)?.features as Array<{ name: string; desc: string; gained_at?: Array<{ level: number }> }> | undefined;
          return (
            <AccordionItem key={c.key} value={c.key}>
              <AccordionTrigger className="text-left">
                <span className="flex items-center gap-2">
                  {c.name}
                  {c.source_document && <Badge variant="outline" className="text-[10px]">{c.source_document}</Badge>}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <SimpleMarkdown text={c.full_description || c.short_description} />
                {features && features.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">Features</div>
                    {features.slice(0, 12).map((f, i) => (
                      <div key={i} className="text-xs">
                        <div className="font-medium">
                          {f.name}
                          {f.gained_at?.[0]?.level && <span className="text-muted-foreground"> · Lvl {f.gained_at[0].level}</span>}
                        </div>
                        <div className="text-muted-foreground line-clamp-3">{f.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </ReferenceShell>
  );
}