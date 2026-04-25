import { useSearchParams } from "react-router-dom";
import { ThemedLoading } from "@/components/ui/themed-loading";
import NotesBoard from "@/components/notes/NotesBoard";
import { BackButton } from "@/components/ui/back-button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Notes = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaign");
  const isDM = searchParams.get("dm") === "true";
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUserId();
  }, []);

  if (!campaignId || !userId) {
    return <ThemedLoading message="Loading notes..." />;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div
        className="bg-card border-b border-brass/20 sticky z-40 shadow-sm"
        style={{ top: "var(--demo-bar-offset, 0px)" }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <BackButton fallback={`/campaigns/${campaignId}`} label="Back" />
            <h1 className="text-2xl font-cinzel font-bold">Session Notes</h1>
            <div className="w-20" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <NotesBoard
          campaignId={campaignId}
          isDM={isDM}
          userId={userId}
        />
      </div>

      
    </div>
  );
};

export default Notes;
