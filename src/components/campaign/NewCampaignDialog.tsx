import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface NewCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewCampaignDialog({ open, onOpenChange, onSuccess }: NewCampaignDialogProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [rules, setRules] = useState<'Milestone' | 'XP'>('Milestone');
  const [startWith, setStartWith] = useState<'blank' | 'clone'>('blank');
  const [cloneFrom, setCloneFrom] = useState<'reckoning'>('reckoning');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in to create a campaign');
        return;
      }

      // Generate a unique 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create the campaign
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          name: name.trim(),
          dm_user_id: user.id,
          code,
        })
        .select()
        .single();

      if (error) throw error;

      // If cloning from template, seed data
      if (startWith === 'clone' && cloneFrom === 'reckoning') {
        // TODO: Implement cloning logic - deep copy from seed with new IDs
        toast.info('Cloning from template not yet implemented');
      }

      toast.success('Campaign created successfully');
      onOpenChange(false);
      onSuccess?.();
      navigate(`/campaign-hub?campaign=${campaign.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-2xl">Create New Campaign</DialogTitle>
          <DialogDescription>
            Start a fresh adventure or clone from a template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Lost Mines of Phandelver"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Progression System</Label>
            <RadioGroup value={rules} onValueChange={(v) => setRules(v as 'Milestone' | 'XP')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Milestone" id="milestone" />
                <Label htmlFor="milestone" className="font-normal cursor-pointer">
                  Milestone (recommended)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="XP" id="xp" />
                <Label htmlFor="xp" className="font-normal cursor-pointer">
                  Experience Points
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Start With</Label>
            <RadioGroup value={startWith} onValueChange={(v) => setStartWith(v as 'blank' | 'clone')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blank" id="blank" />
                <Label htmlFor="blank" className="font-normal cursor-pointer">
                  Blank Campaign (empty)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="clone" id="clone" />
                <Label htmlFor="clone" className="font-normal cursor-pointer">
                  Clone from Template
                </Label>
              </div>
            </RadioGroup>

            {startWith === 'clone' && (
              <Select value={cloneFrom} onValueChange={(v) => setCloneFrom(v as 'reckoning')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reckoning">The Reckoning</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Campaign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
