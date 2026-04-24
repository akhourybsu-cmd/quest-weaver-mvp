import { useState, useMemo } from "react";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import { useRulesList } from "@/lib/rulesApi/useRulesList";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { SimpleMarkdown } from "@/components/reference/SimpleMarkdown";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function SpeciesReference() {
  const { items, meta, loading, error } = useRulesList({
    loader: () => rulesApiService.getSpecies(),
    seedTable: "srd_ancestries",
    seedAdapter: (rows) => rows.map((r) => ({
      id: r.id, key: r.id, slug: null, name: r.name,
      content_type: "species" as const, source_api: "open5e_v2" as const,
      source_document: "Local seed", ruleset_version: "5e SRD", license_type: "OGL 1.0a",
      short_description: `Size: ${r.size} · Speed: ${r.speed} ft.`,
      full_description: `**Size:** ${r.size}\n\n**Speed:** ${r.speed} ft.\n\n**Languages:** ${(r.languages || []).join(", ")}`,
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
      title="Species"
      description="Playable species from the SRD."
      source={meta.source}
      fromCache={meta.fromCache}
      fallbackUsed={meta.fallbackUsed}
      loading={loading}
      error={error}
      empty={!loading && filtered.length === 0}
      count={items.length}
      toolbar={<Input placeholder="Search species…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />}
    >
      <Accordion type="single" collapsible className="w-full">
        {filtered.map((s) => {
          const traits = (s.normalized_json as any)?.traits as Array<{ name: string; desc: string }> | undefined;
          return (
            <AccordionItem key={s.key} value={s.key}>
              <AccordionTrigger className="text-left">{s.name}</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <SimpleMarkdown text={s.full_description || s.short_description} />
                {traits && traits.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">Traits</div>
                    {traits.map((t, i) => (
                      <div key={i} className="text-xs">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-muted-foreground">{t.desc}</div>
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