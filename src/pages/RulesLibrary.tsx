import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Library, Loader2, Search, Scale, Sparkles, AlertCircle, SlidersHorizontal, Filter } from "lucide-react";
import RulesEntityDrawer from "@/components/rules/RulesEntityDrawer";
import CampaignSourceSettings from "@/components/campaign/CampaignSourceSettings";
import { useCampaign } from "@/contexts/CampaignContext";
import { useCampaignEnabledSources, isSourceEnabledForCampaign } from "@/lib/rules/campaignSources";
import {
  searchLibrary,
  getLibraryFacets,
  contentTypeLabel,
  CANONICAL_CONTENT_TYPES,
  type CanonicalContentType,
  type CanonicalEntity,
  type LibraryFacets,
} from "@/lib/rules/cacheAdapter";
import { enabledRulesSources, sourceLabel } from "@/lib/rules/sources";

const ALL = "__all__";

export default function RulesLibrary() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [contentType, setContentType] = useState<string>(ALL);
  const [sourceKey, setSourceKey] = useState<string>(ALL);
  const [ruleset, setRuleset] = useState<string>(ALL);

  const [results, setResults] = useState<CanonicalEntity[]>([]);
  const [facets, setFacets] = useState<LibraryFacets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<CanonicalEntity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Campaign context: when present, gate the library to the campaign's enabled
  // sources. Global browse (no ?code=) shows everything.
  const { campaign, role } = useCampaign();
  const { enabled: campaignSources, refresh: refreshCampaignSources } = useCampaignEnabledSources(campaign?.id);
  const [showCampaignSettings, setShowCampaignSettings] = useState(false);
  const isDM = role === "DM";

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Facets once on mount.
  useEffect(() => {
    getLibraryFacets().then(setFacets).catch(() => setFacets(null));
  }, []);

  // Run search when filters change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchLibrary({
      query: debounced || undefined,
      contentType: contentType === ALL ? undefined : (contentType as CanonicalContentType),
      sourceKey: sourceKey === ALL ? undefined : sourceKey,
      ruleset: ruleset === ALL ? undefined : ruleset,
      limit: 200,
    })
      .then((r) => { if (!cancelled) setResults(r); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Search failed"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, contentType, sourceKey, ruleset]);

  const sourceOptions = useMemo(
    () => enabledRulesSources().filter(
      (s) => (facets?.bySource[s.key] ?? 0) > 0 && isSourceEnabledForCampaign(campaignSources, s.key)
    ),
    [facets, campaignSources]
  );

  // Gate results to the campaign's enabled sources (no-op when unconfigured/global).
  const visibleResults = useMemo(
    () => results.filter((e) => isSourceEnabledForCampaign(campaignSources, e.sourceKey)),
    [results, campaignSources]
  );
  const rulesetOptions = useMemo(
    () => Object.keys(facets?.byRuleset ?? {}).filter((r) => r !== "unknown").sort(),
    [facets]
  );

  const openEntity = (e: CanonicalEntity) => { setSelected(e); setDrawerOpen(true); };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-brass/20 bg-card/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/reference">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-brass hover:bg-brass/10">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-cinzel tracking-wide text-xs uppercase">Reference</span>
            </Button>
          </Link>
          <Link to="/attribution">
            <Button variant="outline" size="sm" className="gap-1.5 border-brass/30 hover:bg-brass/10 hover:text-brass text-xs">
              <Scale className="h-3.5 w-3.5" />
              Attribution
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-7">
          <Library className="h-7 w-7 text-brass/70 mx-auto mb-3" />
          <h1 className="font-cinzel font-bold text-3xl md:text-4xl tracking-wide text-foreground mb-2">
            Rules Library
          </h1>
          <p className="font-cormorant text-lg italic text-muted-foreground max-w-xl mx-auto">
            Search the open-licensed compendium. Every entry is labelled with its source and license.
          </p>
        </div>

        {/* Campaign scope banner + DM source settings */}
        {campaign && (
          <div className="mb-5">
            <div className="flex items-center justify-between gap-2 rounded-md border border-brass/20 bg-brass/5 px-3 py-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-brass" />
                {campaignSources === null
                  ? <>Showing <strong className="text-foreground">all sources</strong> for <strong className="text-foreground">{campaign.name}</strong> (no source filter configured).</>
                  : <>Filtered to <strong className="text-foreground">{campaign.name}</strong>'s enabled sources.</>}
              </p>
              {isDM && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs border-brass/30 hover:bg-brass/10 hover:text-brass shrink-0"
                  onClick={() => setShowCampaignSettings((v) => !v)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {showCampaignSettings ? "Hide" : "Sources"}
                </Button>
              )}
            </div>
            {isDM && showCampaignSettings && (
              <div className="mt-3">
                <CampaignSourceSettings campaignId={campaign.id} onChanged={refreshCampaignSources} />
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className="pl-9"
            />
          </div>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="sm:w-44"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {CANONICAL_CONTENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {contentTypeLabel(t)}{facets?.byType[t] ? ` (${facets.byType[t]})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceKey} onValueChange={setSourceKey}>
            <SelectTrigger className="sm:w-40"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sources</SelectItem>
              {sourceOptions.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.name} ({facets?.bySource[s.key]})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {rulesetOptions.length > 1 && (
            <Select value={ruleset} onValueChange={setRuleset}>
              <SelectTrigger className="sm:w-36"><SelectValue placeholder="Ruleset" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All rulesets</SelectItem>
                {rulesetOptions.map((r) => (
                  <SelectItem key={r} value={r}>{r} ({facets?.byRuleset[r]})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Result meta */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-cinzel tracking-widest uppercase text-muted-foreground">
            {loading ? "Searching…" : `${visibleResults.length} result${visibleResults.length === 1 ? "" : "s"}`}
            {facets ? ` · ${facets.total} in library` : ""}
          </p>
        </div>

        {/* Results */}
        {error ? (
          <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Searching the archives…
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="h-7 w-7 text-brass/50 mx-auto mb-3" />
            <p className="font-cinzel text-foreground mb-1">No entries found</p>
            <p className="font-cormorant italic text-muted-foreground text-sm max-w-sm mx-auto">
              {facets && facets.total === 0
                ? "The library is empty. An admin can populate it from /admin → Sync from Open5e."
                : campaignSources !== null
                ? "No entries from this campaign's enabled sources. A DM can adjust sources above."
                : "Try a different search or relax the filters."}
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {visibleResults.map((e) => (
              <Card
                key={e.id}
                className="fantasy-section p-3 cursor-pointer hover:border-brass/50 transition-colors"
                onClick={() => openEntity(e)}
              >
                <CardContent className="p-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-cinzel font-semibold text-sm leading-snug">{e.name}</h3>
                    <Badge variant="secondary" className="text-[9px] shrink-0 font-cinzel">
                      {contentTypeLabel(e.contentType)}
                    </Badge>
                  </div>
                  {e.shortDescription && (
                    <p className="text-xs text-muted-foreground line-clamp-2 font-cormorant">
                      {e.shortDescription}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <Badge variant="outline" className="text-[9px]">{sourceLabel(e.sourceKey)}</Badge>
                    {e.ruleset && <Badge variant="outline" className="text-[9px] text-muted-foreground">{e.ruleset}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <RulesEntityDrawer entity={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
