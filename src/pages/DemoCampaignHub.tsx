import { useParams } from "react-router-dom";
import { DemoProvider } from "@/contexts/DemoContext";
import { DemoBar } from "@/components/demo/DemoBar";
import DemoCampaignManager from "./DemoCampaignManager";

export default function DemoCampaignHub() {
  const { demoId } = useParams<{ demoId: string }>();

  return (
    <DemoProvider demoId={demoId}>
      <DemoBar />
      <DemoCampaignManager />
    </DemoProvider>
  );
}
