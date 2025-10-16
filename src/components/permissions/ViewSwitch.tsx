import { Eye, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCampaign } from '@/contexts/CampaignContext';
import { RoleGuard } from './RoleGuard';

export function ViewSwitch() {
  const { viewMode, setViewMode } = useCampaign();

  return (
    <RoleGuard require="DM">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
        <Button
          variant={viewMode === 'dm' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('dm')}
          className="h-8"
        >
          <Shield className="h-4 w-4 mr-2" />
          DM View
        </Button>
        <Button
          variant={viewMode === 'player' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('player')}
          className="h-8"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Player
        </Button>
      </div>
    </RoleGuard>
  );
}
