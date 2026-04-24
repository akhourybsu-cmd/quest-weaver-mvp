import { useState, useMemo } from "react";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import { useRulesList } from "@/lib/rulesApi/useRulesList";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { SimpleMarkdown } from "@/components/reference/SimpleMarkdown";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function BackgroundsReference() {
  const { items, meta, loading, error } = useRulesList({
    loader: () => rulesApiService.getBackgrounds(),
    seedTable: "srd_backgrounds",
    seedAdapter: (rows) => rows.map((r) => ({
      id: r.id, key: r.id, slug: null, name: r.name,
      content_type: "background" as const, source_api: "open5e_v2" as const,
      source_document: "Local seed", ruleset_version: "5e SRD", license_type: "OGL 1.0a",
      short_description: r.feature?.name ?? "",
      full_description: `**Skill Proficiencies:** ${(r.skill_proficiencies || []).join(", ")}\n\n${r.feature?.description ?? ""}`,
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
      title="Backgrounds"
      description="Origin backgrounds from the SRD."
      source={meta.source}
      fromCache={meta.fromCache}
      fallbackUsed={meta.fallbackUsed}
      loading={loading}
      error={error}
      empty={!loading && filtered.length === 0}
      count={items.length}
      toolbar={<Input placeholder="Search backgrounds…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />}
    >
      <Accordion type="single" collapsible className="w-full">
        {filtered.map((b) => {
          const benefits = (b.normalized_json as any)?.benefits as Array<{ name: string; desc: string }> | undefined;
          return (
            <AccordionItem key={b.key} value={b.key}>
              <AccordionTrigger className="text-left">{b.name}</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <SimpleMarkdown text={b.full_description || b.short_description} />
                {benefits && benefits.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">Benefits</div>
                    {benefits.slice(0, 8).map((bf, i) => (
                      <div key={i} className="text-xs">
                        <div className="font-medium">{bf.name}</div>
                        <div className="text-muted-foreground line-clamp-3">{bf.desc}</div>
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