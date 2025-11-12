import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Link2 } from 'lucide-react';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import CharacterSelectionDialog from '@/components/character/CharacterSelectionDialog';

interface JoinCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  playerId: string;
}

export const JoinCampaignDialog = ({ open, onClose, playerId }: JoinCampaignDialogProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  const { linkCampaign } = usePlayerLinks(playerId);

  const handleJoinCampaign = async () => {
    if (!code.trim()) return;

    setLoading(true);
    try {
      const result = await linkCampaign(code.trim());
      if (result.success && result.campaignId) {
        setCampaignId(result.campaignId);
        setShowCharacterSelection(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelected = () => {
    setShowCharacterSelection(false);
    setCode('');
    setCampaignId(null);
    onClose();
  };

  const handleClose = () => {
    setCode('');
    setCampaignId(null);
    setShowCharacterSelection(false);
    onClose();
  };

  if (showCharacterSelection && campaignId) {
    return (
      <CharacterSelectionDialog
        open={showCharacterSelection}
        campaignId={campaignId}
        onComplete={handleCharacterSelected}
        onCancel={handleClose}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-2xl">Join Campaign</DialogTitle>
          <DialogDescription>
            Enter the campaign code provided by your Dungeon Master
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Campaign Code</Label>
            <Input
              id="code"
              placeholder="Enter code..."
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              maxLength={8}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleJoinCampaign();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleJoinCampaign} disabled={loading || !code.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Join Campaign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};