import NotesBoard from "@/components/notes/NotesBoard";

interface NotesTabProps {
  campaignId: string;
  userId: string;
}

export function NotesTab({ campaignId, userId }: NotesTabProps) {
  return (
    <div className="h-full">
      <NotesBoard campaignId={campaignId} isDM={true} userId={userId} />
    </div>
  );
}
