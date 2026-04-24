import { useState, useMemo } from "react";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import { useRulesList } from "@/lib/rulesApi/useRulesList";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { SimpleMarkdown } from "@/components/reference/SimpleMarkdown";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FeatsReference() {
  const { items, meta, loading, error } = useRulesList({
    loader: () => rulesApiService.getFeats(),
    seedTable: "srd_feats",
    seedAdapter: (rows) => rows.map((r) => ({
      id: r.id, key: r.id, slug: null, name: r.name,
      content_type: "feat" as const, source_api: "open5e_v2" as const,
      source_document: "Local seed", ruleset_version: "5e SRD", license_type: "OGL 1.0a",
      short_description: r.prerequisite ? `Prerequisite: ${r.prerequisite}` : "",
      full_description: `${r.prerequisite ? `**Prerequisite:** ${r.prerequisite}\n\n` : ""}${r.description ?? ""}`,
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
      title="Feats"
      description="SRD feats. Open5e is the primary source; falls back to seed data if the API is unavailable."
      source={meta.source}
      fromCache={meta.fromCache}
      fallbackUsed={meta.fallbackUsed}
      loading={loading}
      error={error}
      empty={!loading && filtered.length === 0}
      count={items.length}
      toolbar={<Input placeholder="Search feats…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />}
    >
      <Accordion type="single" collapsible className="w-full">
        {filtered.map((f) => {
          const n = f.normalized_json as any;
          return (
            <AccordionItem key={f.key} value={f.key}>
              <AccordionTrigger className="text-left">{f.name}</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                {n?.prerequisite && (
                  <div className="text-xs text-muted-foreground"><strong>Prerequisite:</strong> {n.prerequisite}</div>
                )}
                <SimpleMarkdown text={f.full_description || f.short_description} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </ReferenceShell>
  );
}