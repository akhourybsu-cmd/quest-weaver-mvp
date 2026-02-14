import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartyRoster } from "@/components/party/PartyRoster";
import { PartyInventoryView } from "@/components/party/PartyInventoryView";
import { DMCharacterNotes } from "@/components/party/DMCharacterNotes";
import { Users, Package, FileText } from "lucide-react";

interface PartyTabProps {
  campaignId: string;
}

export function PartyTab({ campaignId }: PartyTabProps) {
  return (
    <div className="h-full">
      <Tabs defaultValue="roster" className="h-full">
        <TabsList className="bg-card/50 border border-brass/20 mb-4">
          <TabsTrigger value="roster" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Roster
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            DM Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-0">
          <PartyRoster campaignId={campaignId} />
        </TabsContent>
        <TabsContent value="inventory" className="mt-0">
          <PartyInventoryView campaignId={campaignId} />
        </TabsContent>
        <TabsContent value="notes" className="mt-0">
          <DMCharacterNotes campaignId={campaignId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
