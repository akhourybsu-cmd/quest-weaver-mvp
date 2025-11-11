import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Link2, CheckCircle2 } from 'lucide-react';

const LinkCampaign = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { getPlayer } = usePlayer();
  const { linkCampaign } = usePlayerLinks(playerId);
  
  const [code, setCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [linkedCampaignId, setLinkedCampaignId] = useState<string | null>(null);

  const player = playerId ? getPlayer(playerId) : null;

  const handleLink = async () => {
    if (!code.trim() || linking) return;

    setLinking(true);
    const result = await linkCampaign(code.trim().toUpperCase());
    setLinking(false);

    if (result.success) {
      setSuccess(true);
      setLinkedCampaignId(result.campaignId || null);
    }
  };

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Player not found</p>
          <Button onClick={() => navigate('/player')}>Back to Hub</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="rounded-2xl shadow-xl border-brass/30 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-cinzel text-2xl">Campaign Linked!</CardTitle>
            <CardDescription>
              You can now join sessions for this campaign with one click
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => navigate(`/player/${playerId}`)}
              className="w-full"
              size="lg"
            >
              Back to Dashboard
            </Button>
            {linkedCampaignId && (
              <Button
                onClick={() => navigate(`/player/${playerId}/waiting?campaign=${linkedCampaignId}`)}
                variant="outline"
                className="w-full"
              >
                Join Now
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/player/${playerId}`)}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-cinzel font-bold text-foreground">
            Link to Campaign
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card className="rounded-2xl shadow-xl border-brass/30">
          <CardHeader>
            <CardTitle className="font-cinzel text-2xl">Enter Campaign Code</CardTitle>
            <CardDescription>
              Ask your DM for the 6-8 character campaign code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Code Input */}
            <div className="space-y-2">
              <Label htmlFor="code">Campaign Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="text-2xl font-mono text-center tracking-wider"
                maxLength={8}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLink();
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">
                The code is case-insensitive and typically 6-8 characters
              </p>
            </div>

            {/* Player Info */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-4"
                style={{
                  borderColor: player.color,
                  background: `linear-gradient(135deg, ${player.color}20, ${player.color}40)`,
                  color: player.color,
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{player.name}</p>
                <p className="text-sm text-muted-foreground">Linking as this player</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/player/${playerId}`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLink}
                disabled={!code.trim() || linking}
                className="flex-1 gap-2"
              >
                <Link2 className="w-4 h-4" />
                {linking ? 'Linking...' : 'Link Campaign'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LinkCampaign;
