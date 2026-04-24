import { useState, useMemo } from "react";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import { useRulesList } from "@/lib/rulesApi/useRulesList";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { SimpleMarkdown } from "@/components/reference/SimpleMarkdown";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function RulesReference() {
  const { items, meta, loading, error } = useRulesList({ loader: () => rulesApiService.getRules() });
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => items.filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase()) || i.full_description.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );
  return (
    <ReferenceShell
      title="Rules"
      description="Core 5e rules from the SRD."
      source={meta.source}
      fromCache={meta.fromCache}
      fallbackUsed={meta.fallbackUsed}
      loading={loading}
      error={error}
      empty={!loading && filtered.length === 0}
      count={items.length}
      toolbar={<Input placeholder="Search rules…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />}
    >
      <Accordion type="single" collapsible className="w-full">
        {filtered.map((r) => (
          <AccordionItem key={r.key} value={r.key}>
            <AccordionTrigger className="text-left">{r.name}</AccordionTrigger>
            <AccordionContent>
              <SimpleMarkdown text={r.full_description || r.short_description} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ReferenceShell>
  );
}