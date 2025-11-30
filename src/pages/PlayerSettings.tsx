import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerNavigation } from '@/components/player/PlayerNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PlayerSettings = () => {
  const { player, loading: playerLoading, updatePlayer } = usePlayer();
  const { toast } = useToast();
  const [name, setName] = useState(player?.name || '');
  const [color, setColor] = useState(player?.color || '#3b82f6');
  const [saving, setSaving] = useState(false);

  if (playerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePlayer({ name, color });
      toast({
        title: 'Settings Saved',
        description: 'Your player settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brass/5 flex">
      <PlayerNavigation playerId={player.id} />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-cinzel font-bold text-foreground">
              Player Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your player profile and preferences
            </p>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl shadow-xl border-brass/30">
              <CardHeader>
                <CardTitle className="font-cinzel text-2xl">Profile</CardTitle>
                <CardDescription>
                  Update your display name and avatar color
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24 border-4 border-brass/30">
                    <AvatarImage src={player.avatar_url} />
                    <AvatarFallback style={{ backgroundColor: color }}>
                      {name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" disabled>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Avatar (Coming Soon)
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Avatar Color</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-muted-foreground">
                      Choose a color for your avatar
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={saving || !name}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-xl border-brass/30">
              <CardHeader>
                <CardTitle className="font-cinzel text-2xl">Preferences</CardTitle>
                <CardDescription>
                  Additional settings coming soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  More customization options will be available in future updates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerSettings;
