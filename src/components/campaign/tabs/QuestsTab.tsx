import QuestLog from "@/components/quests/QuestLog";

interface QuestsTabProps {
  campaignId: string;
}

export function QuestsTab({ campaignId }: QuestsTabProps) {
  return <QuestLog campaignId={campaignId} isDM={true} />;
}
