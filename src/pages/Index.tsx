import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sword,
  Shield,
  Scroll,
  Sparkles,
  Trophy,
  ChevronRight,
  Flame,
  FlaskConical,
  BookOpen,
  Users,
  Play,
  Menu,
  X,
  MessageCircle,
  History,
  Map,
  Globe,
  Brain,
  Clock,
  Zap,
  Layers,
  FileText,
  UserCheck,
  Compass,
  Crown,
  Wand2,
  Dices,
} from "lucide-react";
import { createDemo, cleanupExpiredDemos } from "@/lib/demoHelpers";
import { Session } from "@supabase/supabase-js";

interface IndexProps {
  session: Session | null;
}

const Index = ({ session }: IndexProps) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"dm" | "player">("dm");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = !!session;

  useEffect(() => {
    cleanupExpiredDemos();
  }, []);

  const handleStartSession = () => {
    if (isAuthenticated) {
      navigate("/campaign-hub");
    } else {
      navigate("/auth");
    }
  };

  const handleTryDemo = () => {
    const { demoId } = createDemo();
    navigate(`/demo/${demoId}/campaign`);
  };

  const dmFeatures = [
    {
      icon: Sword,
      title: "Initiative & Combat",
      description: "Lightning-fast turn tracking, lair actions, condition pips, and a full combat log.",
    },
    {
      icon: Flame,
      title: "Encounter Builder",
      description: "Build encounters by CR, environment, and tags. Drag monsters in and balance on the fly.",
    },
    {
      icon: Map,
      title: "World Map",
      description: "Interactive maps with pinned locations, fog of war, and region linking.",
    },
    {
      icon: Globe,
      title: "Lore & Worldbuilding",
      description: "Interconnected lore entries with graph view, cross-links, and a missing-lore detector.",
    },
    {
      icon: Brain,
      title: "AI Generators",
      description: "Generate NPCs, encounters, factions, and locations with AI — then import directly into your campaign.",
    },
    {
      icon: Users,
      title: "NPC & Faction Management",
      description: "Full NPC profiles, faction hierarchies, relationship tracking, and GM-only secrets.",
    },
    {
      icon: Scroll,
      title: "Quest & Session Log",
      description: "Quest chapters, session notes, prep checklists, and campaign timelines in one place.",
    },
    {
      icon: Trophy,
      title: "Loot & Item Vault",
      description: "Rarity filters, attunement rules, and instant distribution to the party.",
    },
    {
      icon: Sparkles,
      title: "Spells & Effects",
      description: "Concentration tracking, durations, AoE templates, and quick SRD reference.",
    },
  ];

  const playerFeatures = [
    {
      icon: Shield,
      title: "Full Character Sheets",
      description: "Complete 5e character sheets — abilities, skills, saves, equipment, and spell management.",
    },
    {
      icon: Compass,
      title: "Player Dashboard",
      description: "Your hub for campaigns, characters, notes, and upcoming sessions — all in one place.",
    },
    {
      icon: Sparkles,
      title: "Spells & Slots",
      description: "Track concentration, spell slots, prepared spells, and ritual casting effortlessly.",
    },
    {
      icon: FlaskConical,
      title: "Inventory & Loot",
      description: "Received loot cards appear instantly. Manage equipment, attunement, and currency.",
    },
    {
      icon: Scroll,
      title: "Quest Tracker",
      description: "Follow story objectives, chapter progress, and rewards synced from your DM.",
    },
    {
      icon: Sword,
      title: "Combat Actions",
      description: "Attack rolls, saves, damage, conditions — all tracked and logged in real time.",
    },
    {
      icon: BookOpen,
      title: "Shared Notes",
      description: "Campaign-wide shared notes alongside your private journal entries.",
    },
    {
      icon: UserCheck,
      title: "Campaign Joining",
      description: "Join campaigns with a code, link characters, and sync with your party instantly.",
    },
  ];

  const features = viewMode === "dm" ? dmFeatures : playerFeatures;

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinkClass =
    "px-3 py-2 text-sm font-medium hover:text-primary transition-all duration-200 hover:underline underline-offset-4 decoration-2 decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md";

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Navbar */}
      <nav
        className={`sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b transition-all duration-200 ${
          isScrolled ? "border-secondary/30 shadow-lg" : "border-secondary/20 shadow-sm"
        }`}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Quest Weaver" className="w-10 h-10" />
            <span className="text-xl font-cinzel font-bold tracking-tight">Quest Weaver</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className={navLinkClass}>
              Features
            </a>
            <a href="#demo" className={navLinkClass}>
              Demo
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/community")}
              className="mx-1"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Community
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/changelog")}
              className="mx-1"
            >
              <History className="w-4 h-4 mr-1" />
              Changelog
            </Button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleTryDemo} className="text-sm">
              Try Demo
            </Button>
            {isAuthenticated ? (
              <Button
                onClick={() => navigate("/campaign-hub")}
                size="default"
                className="group h-10 px-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Go to Dashboard
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button
                onClick={handleStartSession}
                size="default"
                className="group h-10 px-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 hover:bg-accent rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-secondary/20 bg-card">
            <div className="container mx-auto px-6 py-4 flex flex-col gap-2">
              <a
                href="#features"
                className="text-sm font-medium hover:text-primary transition-colors py-2.5 px-3 rounded-md hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#demo"
                className="text-sm font-medium hover:text-primary transition-colors py-2.5 px-3 rounded-md hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demo
              </a>
              <Button
                variant="outline"
                onClick={() => {
                  navigate("/community");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Community
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigate("/changelog");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <History className="w-4 h-4 mr-2" />
                Changelog
              </Button>
              <Separator className="my-2" />
              <Button
                variant="outline"
                onClick={() => {
                  handleTryDemo();
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Play className="w-4 h-4 mr-2" />
                Try Demo
              </Button>
              <Button
                onClick={() => {
                  handleStartSession();
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-2"
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card opacity-90" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-cinzel font-bold leading-tight">
                Run 5e sessions like a seasoned DM.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                {viewMode === "dm"
                  ? "AI-powered worldbuilding, real-time combat, and every tool you need — initiative, loot, lore, and story — in perfect sync."
                  : "Full character sheets, inventory, quest tracking, and combat actions — all synced with your DM's table in real time."}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleStartSession}
                  className="group shadow-lg hover:shadow-xl transition-all"
                >
                  {isAuthenticated
                    ? "Go to Dashboard"
                    : viewMode === "dm"
                    ? "Start Free"
                    : "Join as Player"}
                  <Play className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleTryDemo}>
                  Try the Demo
                </Button>
              </div>
            </div>

            {/* Right Column - Stats Highlight */}
            <div className="relative">
              <div className="rounded-2xl border-2 border-secondary/30 bg-card/80 backdrop-blur p-6 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "20+", label: "DM & Player Tools", icon: Layers },
                    { value: "AI", label: "Powered Generation", icon: Brain },
                    { value: "Real-time", label: "Player Sync", icon: Zap },
                    { value: "Full 5e", label: "Character Sheets", icon: FileText },
                  ].map((stat, idx) => {
                    const StatIcon = stat.icon;
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-secondary/20 bg-background/50 p-4 text-center space-y-2 hover:border-secondary/50 transition-colors"
                      >
                        <StatIcon className="w-6 h-6 mx-auto text-secondary" />
                        <p className="text-2xl font-cinzel font-bold text-primary">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Dices className="w-4 h-4 text-secondary" />
                  <span className="font-cormorant italic">No signup required to demo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DM vs Player Toggle */}
      <section className="border-y border-secondary/20 bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="text-sm font-medium">Show me features for:</p>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("dm")}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  viewMode === "dm"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                Dungeon Master
              </button>
              <button
                onClick={() => setViewMode("player")}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  viewMode === "player"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                Player
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Tiles */}
      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-center mb-4">
            Everything you need at the table
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            {viewMode === "dm"
              ? "From worldbuilding to combat — every tool a Dungeon Master needs, designed for speed at the table."
              : "Your character, your inventory, your quests — always in sync with the party."}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="relative p-4 sm:p-6 rounded-2xl border-2 border-secondary/30 hover:border-secondary/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group min-w-0"
                >
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary border-2 border-secondary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-primary-foreground" />
                  </div>

                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-cinzel font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Quest Weaver */}
      <section id="benefits" className="py-16 bg-card/50 border-y border-secondary/20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-cinzel font-bold text-center mb-4">Why Quest Weaver?</h3>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-10">
            Stop juggling five apps. Everything your table needs lives here.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Layers,
                title: "All-in-One Platform",
                desc: "Combat, lore, NPCs, maps, quests, and character sheets — no more tab chaos.",
              },
              {
                icon: Zap,
                title: "Real-time Sync",
                desc: "DM and players see changes instantly. Loot, initiative, and conditions stay in lockstep.",
              },
              {
                icon: Brain,
                title: "AI-Assisted Prep",
                desc: "Generate NPCs, encounters, factions, and locations in seconds with AI tools.",
              },
              {
                icon: Play,
                title: "Zero-Friction Start",
                desc: "Try the full demo in 30 seconds — no signup, no credit card, no setup.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card
                  key={idx}
                  className="p-6 rounded-xl border border-secondary/30 text-center space-y-3 hover:border-secondary/50 transition-colors"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-cinzel font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo Strip */}
      <section id="demo" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-center mb-6">
            Experience it yourself
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            Jump into our interactive demo to explore the full Campaign Manager.
            No signup required — just dive in and see how Quest Weaver transforms your sessions.
          </p>

          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border-2 border-secondary/30 bg-card p-8 shadow-xl text-center">
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {[
                  "Initiative Tracker",
                  "Encounter Builder",
                  "NPC Management",
                  "Lore Codex",
                  "Bestiary",
                  "Factions",
                  "Quest Log",
                  "Loot & Items",
                ].map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button size="lg" onClick={handleTryDemo} className="shadow-lg">
                <Play className="w-4 h-4 mr-2" />
                Launch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Built For Section */}
      <section className="py-16 bg-card/50 border-y border-secondary/20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-cinzel font-bold text-center mb-4">
            Built for every table
          </h3>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-10">
            Whether it's your first session or your five-hundredth, Quest Weaver scales with you.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Wand2,
                title: "First-Time DMs",
                points: [
                  "Guided campaign setup",
                  "Pre-built encounter templates",
                  "Session prep checklists",
                ],
              },
              {
                icon: Crown,
                title: "Veteran DMs",
                points: [
                  "Deep lore graphs & worldbuilding",
                  "AI-powered content generation",
                  "Faction webs & NPC networks",
                ],
              },
              {
                icon: Shield,
                title: "Players",
                points: [
                  "Full 5e character sheets",
                  "Real-time inventory & quests",
                  "Shared & private notes",
                ],
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <Card
                  key={idx}
                  className="p-6 rounded-2xl border-2 border-secondary/30 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-secondary flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-cinzel font-semibold text-lg">{card.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {card.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-cinzel font-bold max-w-3xl mx-auto leading-tight">
            Bring order to chaos — run tonight's session with Quest Weaver.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleStartSession} className="shadow-lg">
              {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleTryDemo}>
              Try the Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-secondary/20 bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-cinzel font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#features"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#demo"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Demo
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/changelog")}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <History className="w-3 h-3 inline mr-1" />
                    Changelog
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-cinzel font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => navigate("/community")}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-3 h-3 inline mr-1" />
                    Community
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/community?category=feature-requests")}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Feature Requests
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-cinzel font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => navigate("/community?category=campaign-stories")}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Campaign Stories
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/community?category=tips-tricks")}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Tips & Tricks
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Quest Weaver" className="w-8 h-8" />
                <span className="font-cinzel font-bold">Quest Weaver</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The all-in-one D&D 5e companion for Dungeon Masters and players.
              </p>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© 2026 Quest Weaver. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
