/**
 * DEMO CAMPAIGN MANAGER
 * 
 * Mirrors the real CampaignHub layout exactly.
 * Uses localStorage and DemoContext exclusively — NEVER touches Supabase.
 */

import { useState } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { getDemoCampaignStats } from "@/lib/demoAdapters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

import { DemoOverviewTab } from "@/components/demo/tabs/DemoOverviewTab";
import { DemoQuestsTab } from "@/components/demo/tabs/DemoQuestsTab";
import { DemoSessionsTab } from "@/components/demo/tabs/DemoSessionsTab";
import { DemoNPCsTab } from "@/components/demo/tabs/DemoNPCsTab";
import { DemoLocationsTab } from "@/components/demo/tabs/DemoLocationsTab";
import { DemoLoreTab } from "@/components/demo/tabs/DemoLoreTab";
import { DemoFactionsTab } from "@/components/demo/tabs/DemoFactionsTab";
import { DemoBestiaryTab } from "@/components/demo/tabs/DemoBestiaryTab";
import { DemoEncountersTab } from "@/components/demo/tabs/DemoEncountersTab";
import { DemoItemVaultTab } from "@/components/demo/tabs/DemoItemVaultTab";
import { DemoTimelineTab } from "@/components/demo/tabs/DemoTimelineTab";
import { DemoNotesTab } from "@/components/demo/tabs/DemoNotesTab";
import { DemoPartyTab } from "@/components/demo/tabs/DemoPartyTab";
import { DemoPlotBoardTab } from "@/components/demo/tabs/DemoPlotBoardTab";
import { DemoMapsTab } from "@/components/demo/tabs/DemoMapsTab";
import { DemoDMToolsTab } from "@/components/demo/tabs/DemoDMToolsTab";

export default function DemoCampaignManager() {
  if (!window.location.pathname.includes('/demo/')) {
    throw new Error('DemoCampaignManager should only be used for demo routes');
  }

  const { campaign } = useDemo();
  const [activeTab, setActiveTab] = useState("overview");

  if (!campaign) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-arcanePurple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-cinzel text-ink">Loading Demo...</p>
        </div>
      </div>
    );
  }

  const stats = getDemoCampaignStats(campaign);
  const sessionCount = campaign.sessions.filter(s => s.status === "past").length;

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      {/* Header — mirrors real CampaignHub header */}
      <header className="sticky top-0 z-20 border-b border-brass/20 bg-obsidian px-4 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-1">
          <span className="hidden sm:inline text-xs text-brass/60">
            <a href="/" className="hover:text-brass transition-colors">Home</a>
            <span className="mx-1.5">›</span>
            <span className="text-brass/80">Campaign Manager</span>
          </span>
          <Badge className="bg-arcanePurple/20 text-arcanePurple border-arcanePurple/30 hover:bg-arcanePurple/30">
            Demo Mode
          </Badge>
        </div>

        {/* Campaign name and badges */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h1 className="text-base sm:text-xl font-cinzel font-bold text-ink truncate">{campaign.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-brass/30 text-brass text-xs">
              {campaign.system}
            </Badge>
            <Badge variant="outline" className="border-brass/30 text-brass text-xs hidden sm:inline-flex">
              Milestone
            </Badge>
            <Badge variant="outline" className="border-brass/30 text-brass text-xs">
              {sessionCount} Sess.
            </Badge>
            <Badge variant="outline" className="border-brass/30 text-brass text-xs">
              <Users className="w-3 h-3 mr-1" />
              {campaign.party.length}
            </Badge>
          </div>
          <div className="flex-1 hidden sm:block" />
          {/* Player avatars */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <Avatar className="w-6 h-6 sm:w-7 sm:h-7 border border-brass/30 shrink-0">
              <AvatarFallback className="text-xs bg-arcanePurple/20 text-ink">DM</AvatarFallback>
            </Avatar>
            {campaign.party.map((pc) => (
              <Avatar key={pc.id} className="w-6 h-6 sm:w-7 sm:h-7 border border-green-500/50 shrink-0">
                <AvatarFallback className="text-xs bg-green-500/20 text-ink">
                  {pc.portraitInitials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Desktop: Grouped tab bar with dividers — mirrors real CampaignHub exactly */}
          <div className="border-b border-brass/20 px-3 sm:px-4 md:px-6 bg-obsidian sticky top-0 z-20 hidden md:block shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-obsidian to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-obsidian to-transparent z-10 pointer-events-none" />
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="bg-transparent border-0 h-auto p-0 inline-flex min-w-max gap-0">
                  {/* Core */}
                  <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Overview</TabsTrigger>
                  <TabsTrigger value="quests" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Quests</TabsTrigger>
                  <TabsTrigger value="sessions" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Sessions</TabsTrigger>
                  <TabsTrigger value="party" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Party</TabsTrigger>
                  {/* Divider */}
                  <div className="w-px h-5 bg-brass/20 self-center mx-1" />
                  {/* World */}
                  <TabsTrigger value="npcs" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">NPCs</TabsTrigger>
                  <TabsTrigger value="locations" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Locations</TabsTrigger>
                  <TabsTrigger value="lore" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Lore</TabsTrigger>
                  <TabsTrigger value="factions" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Factions</TabsTrigger>
                  <TabsTrigger value="maps" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Maps</TabsTrigger>
                  {/* Divider */}
                  <div className="w-px h-5 bg-brass/20 self-center mx-1" />
                  {/* Combat */}
                  <TabsTrigger value="bestiary" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Bestiary</TabsTrigger>
                  <TabsTrigger value="encounters" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Encounters</TabsTrigger>
                  {/* Divider */}
                  <div className="w-px h-5 bg-brass/20 self-center mx-1" />
                  {/* Assets */}
                  <TabsTrigger value="items" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Item Vault</TabsTrigger>
                  <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Timeline</TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Notes</TabsTrigger>
                  {/* Divider */}
                  <div className="w-px h-5 bg-brass/20 self-center mx-1" />
                  {/* Utility */}
                  <TabsTrigger value="dmtools" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">DM Tools</TabsTrigger>
                  <TabsTrigger value="plotboard" className="data-[state=active]:border-b-2 data-[state=active]:border-arcanePurple data-[state=active]:text-ink data-[state=inactive]:text-brass/70 hover:text-ink px-4 py-3 whitespace-nowrap transition-colors">Plot Board</TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>

          {/* Mobile: Grouped dropdown navigation */}
          <div className="border-b border-brass/20 px-3 py-2 bg-obsidian sticky top-0 z-20 md:hidden shadow-sm">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="bg-card/50 border-brass/30 font-cinzel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">📋 Overview</SelectItem>
                <SelectItem value="quests">📜 Quests</SelectItem>
                <SelectItem value="sessions">📅 Sessions</SelectItem>
                <SelectItem value="party">👥 Party</SelectItem>
                <SelectItem value="npcs">👥 NPCs</SelectItem>
                <SelectItem value="locations">📍 Locations</SelectItem>
                <SelectItem value="lore">📖 Lore</SelectItem>
                <SelectItem value="factions">🏰 Factions</SelectItem>
                <SelectItem value="maps">🗺️ Maps</SelectItem>
                <SelectItem value="bestiary">🔥 Bestiary</SelectItem>
                <SelectItem value="encounters">⚔️ Encounters</SelectItem>
                <SelectItem value="items">📦 Item Vault</SelectItem>
                <SelectItem value="timeline">⏳ Timeline</SelectItem>
                <SelectItem value="notes">📝 Notes</SelectItem>
                <SelectItem value="dmtools">🧰 DM Tools</SelectItem>
                <SelectItem value="plotboard">🕸️ Plot Board</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tab content */}
          <div className="flex-1 p-3 sm:p-4 md:p-6">
            <TabsContent value="overview" className="mt-0 h-full">
              <DemoOverviewTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="quests" className="mt-0 h-full">
              <DemoQuestsTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="sessions" className="mt-0 h-full">
              <DemoSessionsTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="party" className="mt-0 h-full">
              <DemoPartyTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="npcs" className="mt-0 h-full">
              <DemoNPCsTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="locations" className="mt-0 h-full">
              <DemoLocationsTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="lore" className="mt-0 h-full">
              <DemoLoreTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="factions" className="mt-0 h-full">
              <DemoFactionsTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="maps" className="mt-0 h-full">
              <DemoMapsTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="bestiary" className="mt-0 h-full">
              <DemoBestiaryTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="encounters" className="mt-0 h-full">
              <DemoEncountersTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="items" className="mt-0 h-full">
              <DemoItemVaultTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-0 h-full">
              <DemoTimelineTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="notes" className="mt-0 h-full">
              <DemoNotesTab campaign={campaign} />
            </TabsContent>
            <TabsContent value="dmtools" className="mt-0 h-full">
              <DemoDMToolsTab />
            </TabsContent>
            <TabsContent value="plotboard" className="mt-0 h-full">
              <DemoPlotBoardTab campaign={campaign} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
