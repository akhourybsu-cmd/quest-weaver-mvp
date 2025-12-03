/**
 * DEMO CAMPAIGN MANAGER
 * 
 * This component handles ONLY demo campaigns.
 * It NEVER touches Supabase or real user accounts.
 * Uses localStorage and DemoContext exclusively.
 */

import { useState } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Shield,
  Scroll,
  Calendar,
  MapPin,
  Users,
  Package,
  Flame,
  BookOpen,
  FileText,
  Swords,
  Clock,
  Crown,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

export default function DemoCampaignManager() {
  // Safeguard: This component should ONLY be used for demo routes
  if (!window.location.pathname.includes('/demo/')) {
    throw new Error('DemoCampaignManager should only be used for demo routes');
  }

  const { campaign } = useDemo();
  const [activeTab, setActiveTab] = useState("overview");

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-cinzel mb-4">Loading Demo...</h2>
        </div>
      </div>
    );
  }

  const tabs = [
    { value: "overview", label: "Overview", icon: Shield },
    { value: "quests", label: "Quests", icon: Scroll },
    { value: "sessions", label: "Sessions", icon: Calendar },
    { value: "npcs", label: "NPCs", icon: Users },
    { value: "locations", label: "Locations", icon: MapPin },
    { value: "lore", label: "Lore", icon: BookOpen },
    { value: "factions", label: "Factions", icon: Crown },
    { value: "bestiary", label: "Bestiary", icon: Flame },
    { value: "encounters", label: "Encounters", icon: Swords },
    { value: "items", label: "Items", icon: Package },
    { value: "timeline", label: "Timeline", icon: Clock },
    { value: "notes", label: "Notes", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-brass/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-cinzel">{campaign.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-brass">Demo Mode</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-max">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="overview" className="space-y-6">
            <DemoOverviewTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="quests" className="space-y-6">
            <DemoQuestsTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <DemoSessionsTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="npcs" className="space-y-6">
            <DemoNPCsTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <DemoLocationsTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="lore" className="space-y-6">
            <DemoLoreTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="factions" className="space-y-6">
            <DemoFactionsTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="bestiary" className="space-y-6">
            <DemoBestiaryTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="encounters" className="space-y-6">
            <DemoEncountersTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <DemoItemVaultTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <DemoTimelineTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <DemoNotesTab campaign={campaign} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
