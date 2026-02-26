import { useSearchParams, useNavigate } from "react-router-dom";
import { ThemedLoading } from "@/components/ui/themed-loading";
import { Button } from "@/components/ui/button";
import NotesBoard from "@/components/notes/NotesBoard";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Notes = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Session Notes</h1>
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

      <BottomNav role={isDM ? "dm" : "player"} />
    </div>
  );
};

export default Notes;
