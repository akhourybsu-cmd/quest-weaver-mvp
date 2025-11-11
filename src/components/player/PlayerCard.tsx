import { Player } from '@/types/player';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PlayerCardProps {
  player: Player;
  onSelect: () => void;
  onDelete: () => void;
}

export const PlayerCard = ({ player, onSelect, onDelete }: PlayerCardProps) => {
  return (
    <Card className="rounded-2xl shadow-xl border-brass/30 hover:border-brass/60 transition-all cursor-pointer group">
      <CardContent className="p-6" onClick={onSelect}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 transition-all group-hover:scale-105"
            style={{
              borderColor: player.color,
              background: `linear-gradient(135deg, ${player.color}20, ${player.color}40)`,
            }}
          >
            {player.avatarUrl ? (
              <img src={player.avatarUrl} alt={player.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span style={{ color: player.color }}>
                {player.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-cinzel font-bold text-foreground truncate">
              {player.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              <User className="w-3 h-3 inline mr-1" />
              Player Profile
            </p>
          </div>

          {/* Actions */}
          <AlertDialog>
            <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Player Profile?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove {player.name} from this device. Campaign links will remain in the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
