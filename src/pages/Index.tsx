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
  Dice6,
  Flame,
  FlaskConical,
  BookOpen,
  Users,
  Play,
  Menu,
  X,
  MessageCircle,
  History,
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
    // Cleanup expired demos on load
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
      title: "Initiative & Phases",
      description: "Lightning-fast turn tracking, lair actions, and condition pips.",
    },
    {
      icon: Flame,
      title: "Encounter Builder",
      description: "Drop in monsters by CR, environment, and tags. Add to session in one tap.",
    },
    {
      icon: Trophy,
      title: "Loot Handouts",
      description: "Reward parcels and item cards; distribute to players instantly.",
    },
    {
      icon: Sparkles,
      title: "Spell & Effects",
      description: "Concentration, durations, and quick reference. Keep magic tidy.",
    },
    {
      icon: Scroll,
      title: "Quest Log",
      description: "Chapters, objectives, rewards; syncs to players in real time.",
    },
    {
      icon: FlaskConical,
      title: "Item Vault",
      description: "Rarity filters, attunement rules, multi-grant to party.",
    },
  ];

  const playerFeatures = [
    {
      icon: Shield,
      title: "Character View",
      description: "Stats, conditions, and resources—always in sync with the table.",
    },
    {
      icon: Sparkles,
      title: "Spell & Effects",
      description: "Track concentration, durations, and spell slots effortlessly.",
    },
    {
      icon: FlaskConical,
      title: "Inventory Receipts",
      description: "Received loot and item cards appear instantly in your inventory.",
    },
    {
      icon: Scroll,
      title: "Quest Steps",
      description: "Follow story objectives and chapter progress in real time.",
    },
    {
      icon: Sword,
      title: "Combat Actions",
      description: "Attack rolls, saves, and damage—all tracked and logged.",
    },
    {
      icon: BookOpen,
      title: "Journal Notes",
      description: "Personal notes and backstory kept private or shared with the DM.",
    },
  ];

  const features = viewMode === "dm" ? dmFeatures : playerFeatures;

  const benefits = [
    "Initiative tracker",
    "Encounter builder",
    "Loot handouts",
    "Spell cards",
    "Session notes",
    "Player sync",
  ];

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b transition-all duration-200 ${
        isScrolled ? 'border-brand-brass/30 shadow-lg' : 'border-brand-brass/20 shadow-sm'
      }`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Quest Weaver" className="w-10 h-10" />
            <span className="text-xl font-cinzel font-bold tracking-tight">Quest Weaver</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <a 
              href="#features" 
              className="px-3 py-2 text-sm font-medium hover:text-brand-arcanePurple transition-all duration-200 hover:underline underline-offset-4 decoration-2 decoration-brand-arcanePurple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
            >
              Features
            </a>
            <a 
              href="#benefits" 
              className="px-3 py-2 text-sm font-medium hover:text-brand-arcanePurple transition-all duration-200 hover:underline underline-offset-4 decoration-2 decoration-brand-arcanePurple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
            >
              Benefits
            </a>
            <a 
              href="#demo" 
              className="px-3 py-2 text-sm font-medium hover:text-brand-arcanePurple transition-all duration-200 hover:underline underline-offset-4 decoration-2 decoration-brand-arcanePurple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
            >
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
              onClick={() => navigate("/player-hub")}
              className="mx-1"
            >
              Player Hub
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/campaign-hub")}
            >
              Campaign Hub
            </Button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleTryDemo}
              className="text-sm"
            >
              Try Demo
            </Button>
            <Button 
              onClick={handleStartSession}
              size="default"
              className="group h-10 px-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              {isAuthenticated ? "Campaign Hub" : "Sign Up"}
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
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
          <div className="md:hidden border-t border-brand-brass/20 bg-card">
            <div className="container mx-auto px-6 py-4 flex flex-col gap-2">
              <a 
                href="#features" 
                className="text-sm font-medium hover:text-brand-arcanePurple transition-colors py-2.5 px-3 rounded-md hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#benefits" 
                className="text-sm font-medium hover:text-brand-arcanePurple transition-colors py-2.5 px-3 rounded-md hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Benefits
              </a>
              <a 
                href="#demo" 
                className="text-sm font-medium hover:text-brand-arcanePurple transition-colors py-2.5 px-3 rounded-md hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demo
              </a>
              <Separator className="my-2" />
              <Button 
                variant="outline" 
                onClick={() => {
                  handleTryDemo();
                  setMobileMenuOpen(false);
                }} 
                className="w-full justify-start"
              >
                Try Demo
              </Button>
              <Button 
                onClick={() => {
                  navigate("/community");
                  setMobileMenuOpen(false);
                }} 
                variant="outline"
                className="w-full justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Community
              </Button>
              <Button 
                onClick={() => {
                  navigate("/player-hub");
                  setMobileMenuOpen(false);
                }} 
                variant="outline"
                className="w-full justify-start"
              >
                Player Hub
              </Button>
              <Button 
                onClick={() => {
                  navigate("/campaign-hub");
                  setMobileMenuOpen(false);
                }} 
                variant="outline"
                className="w-full justify-start"
              >
                Campaign Hub
              </Button>
              <Button 
                onClick={() => {
                  handleStartSession();
                  setMobileMenuOpen(false);
                }} 
                className="w-full mt-2"
              >
                {isAuthenticated ? "Campaign Hub" : "Sign Up"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background with grid overlay */}
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
                  ? "A real-time companion that keeps initiative, loot, spells, and story in perfect sync—without slowing play."
                  : "Track your character, inventory, quests, and combat actions in real time—all synced with your DM's table."}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleStartSession}
                  className="group shadow-lg hover:shadow-xl transition-all"
                >
                  {isAuthenticated 
                    ? "Go to Campaign Hub"
                    : viewMode === "dm" 
                    ? "Sign Up Free" 
                    : "Sign Up to Play"}
                  <Play className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
                {viewMode === "player" ? (
                  <Button size="lg" variant="outline" onClick={() => navigate("/player-hub")}>
                    <Users className="w-4 h-4 mr-2" />
                    I'm a Player
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" onClick={handleTryDemo}>
                    Try a Demo
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="rounded-2xl border-2 border-brand-brass/30 bg-card/50 backdrop-blur p-8 shadow-xl">
                <div className="aspect-square flex items-center justify-center">
                  <div className="relative">
                    <Dice6 className="w-32 h-32 text-brand-arcanePurple animate-pulse" />
                    <Sparkles className="w-12 h-12 text-brand-brass absolute -top-4 -right-4 animate-pulse delay-75" />
                    <Flame className="w-12 h-12 text-brand-dragonRed absolute -bottom-2 -left-2 animate-pulse delay-150" />
                  </div>
                </div>
                <p className="text-center text-muted-foreground mt-4 font-cormorant italic">
                  "A tool worthy of the finest campaigns."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DM vs Player Toggle */}
      <section className="border-y border-brand-brass/20 bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="text-sm font-medium">Show me features for:</p>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("dm")}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  viewMode === "dm"
                    ? "bg-brand-arcanePurple text-white"
                    : "bg-background hover:bg-muted"
                }`}
              >
                DM
              </button>
              <button
                onClick={() => setViewMode("player")}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  viewMode === "player"
                    ? "bg-brand-arcanePurple text-white"
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
          <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-center mb-12">
            Everything you need at the table
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="relative p-4 sm:p-6 rounded-2xl border-2 border-brand-brass/30 hover:border-brand-brass/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group min-w-0"
                >
                  {/* Wax seal badge */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-arcanePurple border-2 border-brand-brass flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-brand-arcanePurple/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-brand-arcanePurple" />
                    </div>
                    <h3 className="text-xl font-cinzel font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Row */}
      <section id="benefits" className="py-12 bg-card/50 border-y border-brand-brass/20">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-cinzel font-bold text-center mb-8">What it replaces</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {benefits.map((benefit, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="px-4 py-2 text-sm border-brand-brass/40 hover:border-brand-brass hover:bg-brand-arcanePurple/10 transition-colors"
              >
                {benefit}
              </Badge>
            ))}
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
            Jump into our interactive demo to explore the full Campaign Manager experience. 
            No signup required—just dive in and see how Quest Weaver can transform your sessions.
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border-2 border-brand-brass/30 bg-card p-8 shadow-xl text-center">
              <div className="flex justify-center gap-3 mb-6">
                <Badge variant="secondary">Live Initiative</Badge>
                <Badge variant="secondary">Loot Handouts</Badge>
                <Badge variant="secondary">Spell Panel</Badge>
                <Badge variant="secondary">Player Sync</Badge>
              </div>
              <Button size="lg" onClick={handleTryDemo} className="shadow-lg">
                <Play className="w-4 h-4 mr-2" />
                Try the Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-card/50 border-y border-brand-brass/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "Quest Weaver keeps initiative flowing without the usual chaos. My players love it.",
                author: "Dungeon Master",
                avatar: Shield,
              },
              {
                quote: "Finally, I can track my spells and conditions without flipping through pages.",
                author: "Wizard Player",
                avatar: Sparkles,
              },
              {
                quote: "The loot handout system is incredible. Items appear instantly in inventory.",
                author: "Rogue Player",
                avatar: Trophy,
              },
            ].map((testimonial, idx) => {
              const Avatar = testimonial.avatar;
              return (
                <Card key={idx} className="p-6 rounded-2xl border-2 border-brand-brass/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-brand-arcanePurple/20 border-2 border-brand-brass flex items-center justify-center flex-shrink-0">
                      <Avatar className="w-5 h-5 text-brand-arcanePurple" />
                    </div>
                    <div>
                      <p className="text-sm font-cormorant italic leading-relaxed">"{testimonial.quote}"</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">— {testimonial.author}</p>
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
            Bring order to chaos—run tonight's session with Quest Weaver.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleStartSession} className="shadow-lg">
              {isAuthenticated ? "Go to Campaign Hub" : "Sign Up Free"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleTryDemo}>
              Try a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-brass/20 bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-cinzel font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-brand-arcanePurple transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#demo" className="text-muted-foreground hover:text-brand-arcanePurple transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="text-muted-foreground hover:text-brand-arcanePurple transition-colors">
                    Benefits
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-cinzel font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => navigate("/changelog")}
                    className="text-muted-foreground hover:text-brand-arcanePurple transition-colors"
                  >
                    <History className="w-3 h-3 inline mr-1" />
                    Changelog
                  </button>
                </li>
                <li>
                  <span className="text-muted-foreground">Docs (Coming Soon)</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Roadmap (Coming Soon)</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-cinzel font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => navigate("/community")}
                    className="text-muted-foreground hover:text-brand-arcanePurple transition-colors"
                  >
                    <MessageCircle className="w-3 h-3 inline mr-1" />
                    Forum
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/community?category=feature-requests")}
                    className="text-muted-foreground hover:text-brand-arcanePurple transition-colors"
                  >
                    Feature Requests
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/community?category=campaign-stories")}
                    className="text-muted-foreground hover:text-brand-arcanePurple transition-colors"
                  >
                    Campaign Stories
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
                A table-ready D&D 5e companion for DMs and players.
              </p>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© 2025 Quest Weaver. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-brand-arcanePurple transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-brand-arcanePurple transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
