import EnhancedNPCDirectory from "@/components/npcs/EnhancedNPCDirectory";

interface NPCsTabProps {
  campaignId: string;
}

export function NPCsTab({ campaignId }: NPCsTabProps) {
  return (
    <div className="h-full">
      <EnhancedNPCDirectory campaignId={campaignId} isDM={true} />
    </div>
  );
}
