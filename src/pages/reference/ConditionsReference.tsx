import { useState, useMemo } from "react";
import { rulesApiService } from "@/lib/rulesApi/rulesApiService";
import { useRulesList } from "@/lib/rulesApi/useRulesList";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { SimpleMarkdown } from "@/components/reference/SimpleMarkdown";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ConditionsReference() {
  const { items, meta, loading, error } = useRulesList({ loader: () => rulesApiService.getConditions() });
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => items.filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );
  return (
    <ReferenceShell
      title="Conditions"
      description="Quick reference for the SRD 5e conditions."
      source={meta.source}
      fromCache={meta.fromCache}
      fallbackUsed={meta.fallbackUsed}
      loading={loading}
      error={error}
      empty={!loading && filtered.length === 0}
      count={items.length}
      toolbar={<Input placeholder="Search conditions…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />}
    >
      <Accordion type="single" collapsible className="w-full">
        {filtered.map((c) => (
          <AccordionItem key={c.key} value={c.key}>
            <AccordionTrigger className="text-left">{c.name}</AccordionTrigger>
            <AccordionContent>
              <SimpleMarkdown text={c.full_description || c.short_description} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ReferenceShell>
  );
}