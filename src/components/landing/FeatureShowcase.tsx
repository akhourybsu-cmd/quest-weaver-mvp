import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Shield,
  Sword,
  Users,
  Scroll,
  Map,
  Globe,
  Heart,
  Flame,
  BookOpen,
  Star,
  Zap,
  Target,
  Eye,
  Check,
  Circle,
  FlaskConical,
  Sparkles,
} from "lucide-react";

interface FeatureShowcaseProps {
  viewMode: "dm" | "player";
}

/* ────────────────────────────────────────────
   DM SLIDES
   ──────────────────────────────────────────── */

const DMSlide1_CampaignOverview = () => (
  <div className="space-y-3 p-4">
    {/* Tab bar */}
    <div className="flex gap-1 border-b border-secondary/30 pb-2">
      {["Overview", "NPCs", "Encounters", "Lore", "Sessions"].map((t, i) => (
        <span
          key={t}
          className={`px-3 py-1.5 text-[10px] font-medium rounded-t-md transition-colors ${
            i === 0
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t}
        </span>
      ))}
    </div>

    {/* Stat cards */}
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "Sessions", value: "12", icon: BookOpen },
        { label: "NPCs", value: "24", icon: Users },
        { label: "Quests", value: "8", icon: Scroll },
        { label: "Encounters", value: "15", icon: Sword },
      ].map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-lg border border-secondary/20 bg-background/60 p-2 text-center space-y-1"
        >
          <Icon className="w-4 h-4 mx-auto text-secondary" />
          <p className="text-lg font-cinzel font-bold text-primary">{value}</p>
          <p className="text-[9px] text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>

    {/* Recent activity */}
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</p>
      {[
        { text: "Added NPC: Eldrin the Wise", time: "2m ago", dot: "bg-[hsl(var(--buff-green))]" },
        { text: "Encounter balanced (Deadly → Hard)", time: "15m ago", dot: "bg-[hsl(var(--warning-amber))]" },
        { text: "Session 12 notes saved", time: "1h ago", dot: "bg-[hsl(var(--primary))]" },
      ].map((a) => (
        <div key={a.text} className="flex items-center gap-2 text-[10px]">
          <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
          <span className="flex-1 truncate">{a.text}</span>
          <span className="text-muted-foreground">{a.time}</span>
        </div>
      ))}
    </div>
  </div>
);

const DMSlide2_NPCManagement = () => (
  <div className="space-y-3 p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs font-cinzel font-semibold">NPC Registry</p>
      <Badge variant="secondary" className="text-[9px]">24 NPCs</Badge>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[
        { name: "Eldrin", role: "Quest Giver", faction: "Arcane Council", color: "bg-[hsl(var(--primary))]" },
        { name: "Kira Shadowmend", role: "Merchant", faction: "Trade Guild", color: "bg-[hsl(var(--secondary))]" },
        { name: "Thorgrim", role: "Rival", faction: "Iron Fang", color: "bg-[hsl(var(--dragon-red))]" },
        { name: "Lyria", role: "Ally", faction: "Silver Order", color: "bg-[hsl(var(--buff-green))]" },
        { name: "Vex", role: "Informant", faction: "Undercity", color: "bg-[hsl(var(--debuff-violet))]" },
        { name: "Orin Blackthorn", role: "Villain", faction: "Cult of Ash", color: "bg-[hsl(var(--dragon-red))]" },
      ].map((npc) => (
        <div
          key={npc.name}
          className="rounded-lg border border-secondary/20 bg-background/60 p-2 space-y-1 hover:border-secondary/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-[10px] font-semibold text-center truncate">{npc.name}</p>
          <p className="text-[8px] text-muted-foreground text-center">{npc.role}</p>
          <Badge className={`text-[7px] w-full justify-center ${npc.color} text-primary-foreground border-0`}>
            {npc.faction}
          </Badge>
        </div>
      ))}
    </div>
  </div>
);

const DMSlide3_EncounterBuilder = () => (
  <div className="space-y-3 p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs font-cinzel font-semibold">Encounter Builder</p>
      <Badge className="bg-[hsl(var(--dragon-red))] text-primary-foreground border-0 text-[9px]">Deadly</Badge>
    </div>

    {/* Difficulty bar */}
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>Difficulty</span>
        <span>3,200 / 3,400 XP</span>
      </div>
      <Progress value={94} className="h-2" />
      <div className="flex justify-between text-[8px] text-muted-foreground">
        <span>Easy</span>
        <span>Medium</span>
        <span>Hard</span>
        <span className="font-bold text-[hsl(var(--dragon-red))]">Deadly</span>
      </div>
    </div>

    {/* Monster cards */}
    <div className="space-y-1.5">
      {[
        { name: "Young Red Dragon", cr: "10", hp: "178", type: "Dragon" },
        { name: "Kobold Inventor ×4", cr: "¼", hp: "13 ea", type: "Humanoid" },
        { name: "Fire Elemental", cr: "5", hp: "102", type: "Elemental" },
      ].map((m) => (
        <div key={m.name} className="flex items-center gap-2 rounded-lg border border-secondary/20 bg-background/60 p-2">
          <div className="w-7 h-7 rounded bg-[hsl(var(--dragon-red)/0.15)] flex items-center justify-center shrink-0">
            <Flame className="w-3.5 h-3.5 text-[hsl(var(--dragon-red))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold truncate">{m.name}</p>
            <p className="text-[8px] text-muted-foreground">{m.type} · HP {m.hp}</p>
          </div>
          <Badge variant="outline" className="text-[8px] shrink-0">CR {m.cr}</Badge>
        </div>
      ))}
    </div>
  </div>
);

const DMSlide4_LoreCodex = () => (
  <div className="space-y-3 p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs font-cinzel font-semibold">Lore Codex</p>
      <Badge variant="secondary" className="text-[9px]">Graph View</Badge>
    </div>

    {/* Faux graph nodes */}
    <div className="relative h-32 rounded-lg border border-secondary/20 bg-background/60 overflow-hidden">
      {/* SVG connections */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 130">
        <line x1="75" y1="35" x2="150" y2="65" stroke="hsl(var(--secondary))" strokeWidth="1" opacity="0.5" />
        <line x1="150" y1="65" x2="225" y2="30" stroke="hsl(var(--secondary))" strokeWidth="1" opacity="0.5" />
        <line x1="150" y1="65" x2="120" y2="105" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
        <line x1="150" y1="65" x2="220" y2="100" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
        <line x1="75" y1="35" x2="120" y2="105" stroke="hsl(var(--secondary))" strokeWidth="1" opacity="0.3" />
      </svg>

      {/* Nodes */}
      {[
        { x: "22%", y: "18%", label: "Arcane Council", color: "bg-[hsl(var(--primary))]" },
        { x: "47%", y: "42%", label: "The Sundering", color: "bg-[hsl(var(--dragon-red))]" },
        { x: "72%", y: "15%", label: "Eldergrove", color: "bg-[hsl(var(--buff-green))]" },
        { x: "35%", y: "72%", label: "Cult of Ash", color: "bg-[hsl(var(--warning-amber))]" },
        { x: "70%", y: "68%", label: "Lost Relics", color: "bg-[hsl(var(--secondary))]" },
      ].map((n) => (
        <div
          key={n.label}
          className="absolute flex flex-col items-center gap-0.5"
          style={{ left: n.x, top: n.y }}
        >
          <div className={`w-4 h-4 rounded-full ${n.color} shadow-md border-2 border-card`} />
          <span className="text-[7px] font-medium bg-card/80 px-1 rounded whitespace-nowrap">{n.label}</span>
        </div>
      ))}
    </div>

    {/* Entries list */}
    <div className="space-y-1">
      {[
        { title: "The Sundering", type: "Event", links: 4 },
        { title: "Arcane Council", type: "Faction", links: 3 },
        { title: "Eldergrove", type: "Location", links: 2 },
      ].map((e) => (
        <div key={e.title} className="flex items-center gap-2 text-[10px]">
          <Globe className="w-3 h-3 text-secondary" />
          <span className="flex-1 font-medium">{e.title}</span>
          <Badge variant="outline" className="text-[7px]">{e.type}</Badge>
          <span className="text-muted-foreground">{e.links} links</span>
        </div>
      ))}
    </div>
  </div>
);

const DMSlide5_SessionPrep = () => (
  <div className="space-y-3 p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs font-cinzel font-semibold">Session 13 Prep</p>
      <Badge className="bg-[hsl(var(--buff-green))] text-primary-foreground border-0 text-[9px]">Ready</Badge>
    </div>

    {/* Objectives */}
    <div className="space-y-1.5">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Objectives</p>
      {[
        { text: "Introduce Orin Blackthorn at the tavern", done: true },
        { text: "Dragon lair encounter (Area 4-B)", done: true },
        { text: "Reveal the Cult's plan to the party", done: false },
        { text: "Cliffhanger: portal opens", done: false },
      ].map((o) => (
        <div key={o.text} className="flex items-center gap-2 text-[10px]">
          {o.done ? (
            <Check className="w-3 h-3 text-[hsl(var(--buff-green))]" />
          ) : (
            <Circle className="w-3 h-3 text-muted-foreground" />
          )}
          <span className={o.done ? "line-through text-muted-foreground" : ""}>{o.text}</span>
        </div>
      ))}
    </div>

    {/* Linked encounters */}
    <div className="space-y-1.5">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Linked Encounters</p>
      {[
        { name: "Dragon Lair Assault", difficulty: "Deadly" },
        { name: "Tavern Ambush", difficulty: "Medium" },
      ].map((enc) => (
        <div key={enc.name} className="flex items-center gap-2 rounded-lg border border-secondary/20 bg-background/60 p-1.5 text-[10px]">
          <Target className="w-3 h-3 text-secondary" />
          <span className="flex-1">{enc.name}</span>
          <Badge variant="outline" className="text-[7px]">{enc.difficulty}</Badge>
        </div>
      ))}
    </div>
  </div>
);

/* ────────────────────────────────────────────
   PLAYER SLIDES
   ──────────────────────────────────────────── */

const PlayerSlide1_Stats = () => (
  <div className="space-y-3 p-4">
    {/* Character header */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center border-2 border-secondary/30">
        <Shield className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-cinzel font-bold">Aelindra Stormborn</p>
        <p className="text-[9px] text-muted-foreground">Level 7 Half-Elf Sorcerer</p>
      </div>
      <div className="ml-auto flex gap-2 text-center">
        <div className="px-2 py-1 rounded border border-secondary/20 bg-background/60">
          <p className="text-[8px] text-muted-foreground">AC</p>
          <p className="text-sm font-bold">15</p>
        </div>
        <div className="px-2 py-1 rounded border border-secondary/20 bg-background/60">
          <p className="text-[8px] text-muted-foreground">Speed</p>
          <p className="text-sm font-bold">30</p>
        </div>
        <div className="px-2 py-1 rounded border border-secondary/20 bg-background/60">
          <p className="text-[8px] text-muted-foreground">Prof</p>
          <p className="text-sm font-bold">+3</p>
        </div>
      </div>
    </div>

    {/* HP bar */}
    <div className="space-y-1">
      <div className="flex justify-between text-[9px]">
        <span className="font-semibold flex items-center gap-1"><Heart className="w-3 h-3 text-[hsl(var(--hp-red))]" /> Hit Points</span>
        <span>38 / 45</span>
      </div>
      <Progress value={84} className="h-2.5" />
    </div>

    {/* Ability scores */}
    <div className="grid grid-cols-6 gap-1.5">
      {[
        { ab: "STR", score: 10, mod: "+0" },
        { ab: "DEX", score: 14, mod: "+2" },
        { ab: "CON", score: 13, mod: "+1" },
        { ab: "INT", score: 12, mod: "+1" },
        { ab: "WIS", score: 11, mod: "+0" },
        { ab: "CHA", score: 18, mod: "+4" },
      ].map((a) => (
        <div key={a.ab} className="text-center rounded-lg border border-secondary/20 bg-background/60 py-1.5 space-y-0.5">
          <p className="text-[8px] font-bold text-muted-foreground">{a.ab}</p>
          <p className="text-base font-cinzel font-bold text-primary">{a.mod}</p>
          <p className="text-[8px] text-muted-foreground">{a.score}</p>
        </div>
      ))}
    </div>
  </div>
);

const PlayerSlide2_Narrative = () => (
  <div className="space-y-3 p-4">
    <div className="flex items-center gap-2">
      <BookOpen className="w-4 h-4 text-secondary" />
      <p className="text-xs font-cinzel font-semibold">Character Story</p>
    </div>

    <div className="rounded-lg border border-secondary/20 bg-background/60 p-3 space-y-2">
      <p className="text-[10px] font-cormorant italic leading-relaxed text-muted-foreground">
        "Born amid a tempest that shattered the coast, Aelindra discovered her sorcerous gift when 
        lightning answered her childhood tantrums. Now she seeks the Stormweave — an ancient artifact 
        said to tame the skies themselves..."
      </p>
    </div>

    <div className="grid grid-cols-2 gap-2">
      {[
        { label: "Personality", text: "Curious and impulsive, always chasing the next mystery." },
        { label: "Ideals", text: "Freedom — no one should be caged, not even by fate." },
        { label: "Bonds", text: "My mentor Eldrin vanished; I must find what happened." },
        { label: "Flaws", text: "I trust my instincts over warnings, often recklessly." },
      ].map((t) => (
        <div key={t.label} className="rounded-lg border border-secondary/20 bg-background/60 p-2 space-y-0.5">
          <p className="text-[8px] font-bold text-secondary uppercase tracking-wider">{t.label}</p>
          <p className="text-[9px] text-muted-foreground leading-snug">{t.text}</p>
        </div>
      ))}
    </div>
  </div>
);

const PlayerSlide3_InventorySpells = () => (
  <div className="space-y-3 p-4">
    <div className="grid grid-cols-2 gap-3">
      {/* Inventory */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <FlaskConical className="w-3 h-3 text-secondary" />
          <p className="text-[10px] font-cinzel font-semibold">Inventory</p>
        </div>
        {[
          { name: "Staff of the Tempest", rarity: "Rare", equipped: true },
          { name: "Cloak of Protection", rarity: "Uncommon", equipped: true },
          { name: "Potion of Healing ×3", rarity: "Common", equipped: false },
          { name: "Spell Component Pouch", rarity: "Common", equipped: true },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-1 text-[9px] rounded border border-secondary/20 bg-background/60 p-1.5">
            <span className="flex-1 truncate">{item.name}</span>
            <Badge variant="outline" className="text-[7px]">{item.rarity}</Badge>
          </div>
        ))}
      </div>

      {/* Spell slots */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" />
          <p className="text-[10px] font-cinzel font-semibold">Spell Slots</p>
        </div>
        {[
          { level: "1st", used: 2, max: 4 },
          { level: "2nd", used: 1, max: 3 },
          { level: "3rd", used: 0, max: 3 },
          { level: "4th", used: 0, max: 1 },
        ].map((s) => (
          <div key={s.level} className="flex items-center gap-1.5 text-[9px]">
            <span className="w-6 text-muted-foreground">{s.level}</span>
            <div className="flex gap-0.5 flex-1">
              {Array.from({ length: s.max }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border ${
                    i < s.used
                      ? "bg-muted border-muted-foreground/30"
                      : "bg-[hsl(var(--primary)/0.2)] border-primary/40"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-1">
          <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Prepared</p>
          {["Fire Bolt", "Shield", "Fireball", "Counterspell"].map((sp) => (
            <div key={sp} className="flex items-center gap-1 text-[9px] py-0.5">
              <Star className="w-2.5 h-2.5 text-[hsl(var(--warning-amber))]" />
              <span>{sp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const PlayerSlide4_Dashboard = () => (
  <div className="space-y-3 p-4">
    <p className="text-xs font-cinzel font-semibold">Player Dashboard</p>

    {/* Active campaign card */}
    <div className="rounded-lg border-2 border-primary/30 bg-[hsl(var(--primary)/0.05)] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary" />
          <span className="text-[11px] font-cinzel font-semibold">Curse of the Sundering</span>
        </div>
        <Badge className="bg-[hsl(var(--buff-green))] text-primary-foreground border-0 text-[8px]">Active</Badge>
      </div>
      <div className="flex gap-3 text-[9px] text-muted-foreground">
        <span>DM: Marcus</span>
        <span>Session 12</span>
        <span>5 Players</span>
      </div>
    </div>

    {/* Upcoming session */}
    <div className="rounded-lg border border-secondary/20 bg-background/60 p-2 flex items-center gap-2">
      <div className="w-8 h-8 rounded bg-[hsl(var(--warning-amber)/0.15)] flex items-center justify-center">
        <Zap className="w-4 h-4 text-[hsl(var(--warning-amber))]" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-semibold">Next Session: Friday 7 PM</p>
        <p className="text-[8px] text-muted-foreground">Session 13 — The Dragon's Lair</p>
      </div>
    </div>

    {/* Party strip */}
    <div className="space-y-1">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Your Party</p>
      <div className="flex gap-2">
        {[
          { name: "Aelindra", cls: "Sorcerer", lvl: 7 },
          { name: "Thane", cls: "Paladin", lvl: 7 },
          { name: "Pip", cls: "Rogue", lvl: 7 },
          { name: "Bramble", cls: "Druid", lvl: 6 },
          { name: "Zara", cls: "Bard", lvl: 7 },
        ].map((p) => (
          <div key={p.name} className="text-center space-y-0.5">
            <div className="w-8 h-8 rounded-full bg-muted mx-auto flex items-center justify-center border border-secondary/20">
              <span className="text-[9px] font-bold">{p.name[0]}</span>
            </div>
            <p className="text-[8px] font-medium truncate w-10">{p.name}</p>
            <p className="text-[7px] text-muted-foreground">{p.cls}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ────────────────────────────────────────────
   SHOWCASE CONTAINER
   ──────────────────────────────────────────── */

const DM_SLIDES = [
  { title: "Campaign Overview", component: DMSlide1_CampaignOverview },
  { title: "NPC Management", component: DMSlide2_NPCManagement },
  { title: "Encounter Builder", component: DMSlide3_EncounterBuilder },
  { title: "Lore Codex", component: DMSlide4_LoreCodex },
  { title: "Session Prep", component: DMSlide5_SessionPrep },
];

const PLAYER_SLIDES = [
  { title: "Character Stats", component: PlayerSlide1_Stats },
  { title: "Backstory & Traits", component: PlayerSlide2_Narrative },
  { title: "Inventory & Spells", component: PlayerSlide3_InventorySpells },
  { title: "Player Dashboard", component: PlayerSlide4_Dashboard },
];

const FeatureShowcase = ({ viewMode }: FeatureShowcaseProps) => {
  const slides = viewMode === "dm" ? DM_SLIDES : PLAYER_SLIDES;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset slide on mode switch
  useEffect(() => {
    setCurrentSlide(0);
  }, [viewMode]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 250);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, viewMode]);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === currentSlide) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(idx);
        setIsTransitioning(false);
      }, 200);
    },
    [currentSlide],
  );

  const prev = () => goTo((currentSlide - 1 + slides.length) % slides.length);
  const next = () => goTo((currentSlide + 1) % slides.length);

  const SlideComponent = slides[currentSlide].component;
  const fakeUrl =
    viewMode === "dm"
      ? "quest-weaver.app/campaign/curse-of-the-sundering"
      : "quest-weaver.app/player/aelindra-stormborn";

  return (
    <div
      className="max-w-3xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Browser chrome */}
      <div className="rounded-t-xl bg-[hsl(var(--obsidian))] px-4 py-2.5 flex items-center gap-3">
        {/* Window dots */}
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--dragon-red))]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--warning-amber))]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--buff-green))]" />
        </div>
        {/* URL bar */}
        <div className="flex-1 rounded-md bg-[hsl(var(--foreground)/0.15)] px-3 py-1 text-[10px] text-[hsl(var(--ink))] font-mono truncate">
          {fakeUrl}
        </div>
      </div>

      {/* Slide area */}
      <Card className="rounded-t-none rounded-b-xl border-t-0 overflow-hidden relative min-h-[280px] sm:min-h-[320px]">
        {/* Slide title bar */}
        <div className="flex items-center justify-between border-b border-secondary/20 px-4 py-2 bg-card/80">
          <div className="flex items-center gap-2">
            {viewMode === "dm" ? (
              <Crown className="w-3.5 h-3.5 text-secondary" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-primary" />
            )}
            <span className="text-[10px] font-cinzel font-semibold text-muted-foreground">
              {slides[currentSlide].title}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        {/* Content */}
        <div
          className={`transition-all duration-300 ${
            isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          <SlideComponent />
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card/80 border border-secondary/30 flex items-center justify-center hover:bg-card transition-colors shadow-md"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card/80 border border-secondary/30 flex items-center justify-center hover:bg-card transition-colors shadow-md"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </Card>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === currentSlide
                ? "w-6 h-2 bg-primary"
                : "w-2 h-2 bg-secondary/40 hover:bg-secondary/70"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureShowcase;
