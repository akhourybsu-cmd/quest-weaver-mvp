import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, ExternalLink, Scale, Sparkles } from "lucide-react";
import { RULES_SOURCES, type RulesSourceDef } from "@/lib/rules/sources";

/**
 * Public attribution page. Renders every rules source from the canonical
 * registry (src/lib/rules/sources.ts, which mirrors the seeded rules_sources
 * rows) with its license, attribution line, and upstream/license links.
 * Satisfies the "preserve attribution visibly" requirement.
 */

const SourceCard = ({ s }: { s: RulesSourceDef }) => (
  <Card className="fantasy-section overflow-hidden">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="font-cinzel text-base tracking-wide truncate">
            {s.name}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {s.version && (
              <Badge variant="outline" className="text-[10px] font-cinzel tracking-wide">
                {s.ruleset === "2014" || s.ruleset === "2024" ? `D&D ${s.ruleset}` : s.ruleset} · v{s.version}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Scale className="h-3 w-3" />
              {s.license}
            </Badge>
            {s.isOfficial && (
              <Badge className="text-[10px]" style={{ backgroundColor: "hsl(var(--brass) / 0.85)", color: "#000" }}>
                Official SRD
              </Badge>
            )}
            {!s.isEnabled && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Coming soon
              </Badge>
            )}
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="font-cormorant text-base italic text-foreground/85 leading-snug">
        {s.attribution}
      </p>
      <div className="flex flex-wrap gap-2">
        {s.upstreamUrl && (
          <a href={s.upstreamUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-brass/30 hover:bg-brass/10 hover:text-brass">
              <ExternalLink className="h-3 w-3" />
              Source
            </Button>
          </a>
        )}
        {s.licenseUrl && (
          <a href={s.licenseUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-brass/30 hover:bg-brass/10 hover:text-brass">
              <Scale className="h-3 w-3" />
              License text
            </Button>
          </a>
        )}
      </div>
    </CardContent>
  </Card>
);

const Attribution = () => {
  const sorted = [...RULES_SOURCES].sort((a, b) => a.sortOrder - b.sortOrder);
  const official = sorted.filter((s) => s.isOfficial);
  const community = sorted.filter((s) => !s.isOfficial);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-brass/20 bg-card/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-brass hover:bg-brass/10">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-cinzel tracking-wide text-xs uppercase">Home</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <Sparkles className="h-7 w-7 text-brass/70 mx-auto mb-3" />
          <h1 className="font-cinzel font-bold text-3xl md:text-4xl tracking-wide text-foreground mb-3">
            Sources &amp; Attribution
          </h1>
          <p className="font-cormorant text-lg italic text-muted-foreground max-w-xl mx-auto">
            Questweaver draws on open-licensed game content. Every source it uses is
            credited below, in keeping with the terms of its license.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-brass/50" />
            <div className="w-2 h-2 rotate-45 bg-brass/70 rounded-sm" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-brass/50" />
          </div>
        </div>

        {/* Official SRD */}
        <section className="mb-8">
          <h2 className="fantasy-section-header flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Official System Reference Documents
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {official.map((s) => <SourceCard key={s.key} s={s} />)}
          </div>
        </section>

        {/* Community / open sources */}
        <section className="mb-8">
          <h2 className="fantasy-section-header flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Open &amp; Community Sources
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {community.map((s) => <SourceCard key={s.key} s={s} />)}
          </div>
        </section>

        {/* Legal notice */}
        <Card className="parchment-card">
          <CardContent className="py-5 space-y-3 text-sm text-muted-foreground font-cormorant text-base leading-relaxed">
            <p>
              Questweaver imports only open-licensed SRD / API material. It does
              <strong className="text-foreground"> not </strong>
              include the full Player's Handbook, Dungeon Master's Guide, Monster
              Manual, published adventures, settings, or other proprietary
              Dungeons &amp; Dragons content.
            </p>
            <p>
              D&amp;D System Reference Document content © Wizards of the Coast LLC,
              used under the Creative Commons Attribution 4.0 International License.
              Open Game License content is used under the terms of the OGL 1.0a.
              All trademarks are the property of their respective owners.
            </p>
            <p className="text-xs not-italic font-inter">
              See <code className="px-1 py-0.5 rounded bg-muted">ATTRIBUTION.md</code> and{" "}
              <code className="px-1 py-0.5 rounded bg-muted">LICENSE</code> in the project
              repository for full details.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Attribution;
