/**
 * DEMO CAMPAIGN MANAGER
 * 
 * This component handles ONLY demo campaigns.
 * It NEVER touches Supabase or real user accounts.
 * Uses localStorage and DemoContext exclusively.
 */

import { useState } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { Button } from "@/components/ui/button";
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
  Crown,
  Package,
  Flame,
  BookOpen,
  FileText,
  Users,
} from "lucide-react";
import { DemoOverviewTab } from "@/components/demo/tabs/DemoOverviewTab";
import { DemoQuestsTab } from "@/components/demo/tabs/DemoQuestsTab";
import { DemoLocationsTab } from "@/components/demo/tabs/DemoLocationsTab";
import { DemoBestiaryTab } from "@/components/demo/tabs/DemoBestiaryTab";
import { DemoItemVaultTab } from "@/components/demo/tabs/DemoItemVaultTab";
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
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="quests" className="gap-2">
              <Scroll className="w-4 h-4" />
              <span className="hidden sm:inline">Quests</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Locations</span>
            </TabsTrigger>
            <TabsTrigger value="bestiary" className="gap-2">
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">Bestiary</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Items</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DemoOverviewTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="quests" className="space-y-6">
            <DemoQuestsTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <DemoLocationsTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="bestiary" className="space-y-6">
            <DemoBestiaryTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <DemoItemVaultTab campaign={campaign} />
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <DemoNotesTab campaign={campaign} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
