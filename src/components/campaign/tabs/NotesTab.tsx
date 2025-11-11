import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import NotesBoard from "@/components/notes/NotesBoard";

interface NotesTabProps {
  campaignId: string;
}

export function NotesTab({ campaignId }: NotesTabProps) {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUserId();
  }, []);

  if (!userId) return null;

  return (
    <div className="h-full">
      <NotesBoard campaignId={campaignId} isDM={true} userId={userId} />
    </div>
  );
}
