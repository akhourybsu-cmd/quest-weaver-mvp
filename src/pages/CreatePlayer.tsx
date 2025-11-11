import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

const CreatePlayer = () => {
  const navigate = useNavigate();
  const { createPlayer } = usePlayer();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const handleCreate = () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a player name',
        variant: 'destructive',
      });
      return;
    }

    const player = createPlayer(name.trim(), selectedColor);
    toast({
      title: 'Player created!',
      description: `Welcome, ${player.name}`,
    });
    navigate(`/player/${player.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/player')}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Button>
          <h1 className="text-3xl font-cinzel font-bold text-foreground">
            Create Player Profile
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card className="rounded-2xl shadow-xl border-brass/30">
          <CardHeader>
            <CardTitle className="font-cinzel text-2xl">New Player</CardTitle>
            <CardDescription>
              Create a player profile to join campaigns on this device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Player Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="text-lg"
                maxLength={30}
              />
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <Label>Avatar Color</Label>
              <div className="flex gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 ${
                      selectedColor === color ? 'border-brass ring-2 ring-brass/50' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4"
                  style={{
                    borderColor: selectedColor,
                    background: `linear-gradient(135deg, ${selectedColor}20, ${selectedColor}40)`,
                    color: selectedColor,
                  }}
                >
                  {name.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-cinzel font-bold text-lg">
                    {name || 'Player Name'}
                  </p>
                  <p className="text-sm text-muted-foreground">Player Profile</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/player')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="flex-1 gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create Player
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreatePlayer;
