import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerPageLayout } from '@/components/player/PlayerPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';
import AccountSection from '@/components/player/settings/AccountSection';
import LinkedAssetsSection from '@/components/player/settings/LinkedAssetsSection';
import ForumIdentitySection from '@/components/player/settings/ForumIdentitySection';
import PreferencesSection from '@/components/player/settings/PreferencesSection';

const PlayerSettings = () => {
  const { player, loading: playerLoading, updatePlayer } = usePlayer();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setName(player.name || '');
      setColor(player.color || '#3b82f6');
      setAvatarUrl(player.avatar_url || null);
    }
  }, [player]);

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB', variant: 'destructive' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `${nanoid()}.${ext}`;
      const path = `players/${player.id}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('portraits')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('portraits').getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
      toast({ title: 'Avatar uploaded', description: 'Your avatar has been uploaded. Click Save to apply.' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    toast({ title: 'Avatar removed', description: 'Click Save to apply the change.' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePlayer({ name, color, avatar_url: avatarUrl });
      toast({ title: 'Settings Saved', description: 'Your player settings have been updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PlayerPageLayout playerId={player.id} mobileTitle="Settings">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-8 hidden md:block">
          <h1 className="text-4xl font-cinzel font-bold text-foreground">Player Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your player profile, account, and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="fantasy-border-ornaments rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="font-cinzel text-2xl text-brass tracking-wide">Profile</CardTitle>
              <CardDescription>Update your display name and avatar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-brass/30">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback style={{ backgroundColor: color }}>
                      {name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {avatarUrl && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      onClick={handleRemoveAvatar}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Upload Avatar</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">Max 5MB, JPG/PNG/GIF</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Avatar Color (Fallback)</Label>
                <div className="flex items-center gap-4">
                  <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-20 h-10" />
                  <span className="text-sm text-muted-foreground">Used when no avatar image is set</span>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving || !name} className="w-full sm:w-auto">
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />Save Changes</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Forum Identity */}
          <ForumIdentitySection name={name} avatarUrl={avatarUrl} color={color} />

          {/* Account Management */}
          <AccountSection />

          {/* Linked Assets */}
          <LinkedAssetsSection />

          {/* Preferences */}
          <PreferencesSection />
        </div>
      </div>
    </PlayerPageLayout>
  );
};

export default PlayerSettings;
