import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { Loader2, Mail, KeyRound, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AccountSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const loadEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    };
    loadEmail();
  }, []);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    toast({ title: 'Account deletion requested', description: 'Please contact support to complete account deletion.', variant: 'destructive' });
    setDeleteConfirmText('');
  };

  return (
    <Card className="fantasy-border-ornaments rounded-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="font-cinzel text-2xl text-brass tracking-wide">Account</CardTitle>
        <CardDescription>Manage your credentials and account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email display */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-brass" />
            Email Address
          </Label>
          <Input value={email} disabled className="bg-muted/50" />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-brass/50 to-transparent" />

        {/* Password change */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brass" />
            Password
          </Label>
          {!showPasswordForm ? (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Update Password'}
                </Button>
                <Button variant="ghost" onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-brass/50 to-transparent" />

        {/* Sign out */}
        <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        <div className="h-px bg-gradient-to-r from-transparent via-brass/50 to-transparent" />

        {/* Danger zone */}
        <div className="space-y-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-cinzel font-semibold">Danger Zone</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Deleting your account is permanent and cannot be undone. All your characters, campaigns, and forum posts will be lost.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-cinzel">Delete Account</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Type <span className="font-mono font-bold">DELETE</span> to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Type "DELETE" to confirm'
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSection;
