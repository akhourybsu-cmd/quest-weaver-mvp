import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { DemoProvider } from "@/contexts/DemoContext";
import { DemoBar } from "@/components/demo/DemoBar";
import { DemoLoadingScreen } from "@/components/demo/DemoLoadingScreen";
import DemoCampaignManager from "./DemoCampaignManager";

export default function DemoCampaignHub() {
  const { demoId } = useParams<{ demoId: string }>();
  const [loadingComplete, setLoadingComplete] = useState(false);

  const handleLoadingComplete = useCallback(() => {
    setLoadingComplete(true);
  }, []);

  return (
    <DemoProvider demoId={demoId}>
      {!loadingComplete && (
        <DemoLoadingScreen
          campaignName="The Reckoning"
          onComplete={handleLoadingComplete}
        />
      )}
      <DemoBar />
      <DemoCampaignManager />
    </DemoProvider>
  );
}
