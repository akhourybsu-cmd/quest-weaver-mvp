import FactionDirectory from "@/components/factions/FactionDirectory";

interface FactionsTabProps {
  campaignId: string;
}

export function FactionsTab({ campaignId }: FactionsTabProps) {
  return (
    <div className="h-full">
      <FactionDirectory campaignId={campaignId} isDM={true} />
    </div>
  );
}
