import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * SessionDM - Legacy route that redirects to CampaignHub
 * 
 * All DM session functionality has been consolidated into the CampaignHub's Live Session tab.
 * This component exists only to handle legacy links and redirects.
 */
const SessionDM = () => {
  const params = useParams<{ campaignId?: string; sessionId?: string; demoId?: string }>();
  const navigate = useNavigate();
  const campaignId = params.campaignId || null;
  const isDemo = !!params.demoId;
  const demoId = params.demoId || null;

  useEffect(() => {
    if (campaignId) {
      navigate(isDemo ? `/demo/${demoId}/campaign` : `/campaign-hub?campaign=${campaignId}`, { replace: true });
    } else {
      navigate('/campaign-hub', { replace: true });
    }
  }, [campaignId, navigate, isDemo, demoId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <div className="text-lg">Redirecting to Campaign Hub...</div>
        <div className="text-sm text-muted-foreground">
          Session management is now integrated into the Campaign Hub
        </div>
      </div>
    </div>
  );
};

export default SessionDM;
