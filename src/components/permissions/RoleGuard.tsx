import { ReactNode } from 'react';
import { useCampaign } from '@/contexts/CampaignContext';

interface RoleGuardProps {
  require: 'DM' | 'PLAYER' | 'ANY';
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({ require, fallback = null, children }: RoleGuardProps) {
  const { role, isLoading } = useCampaign();

  if (isLoading) {
    return null;
  }

  if (require === 'ANY' && role) {
    return <>{children}</>;
  }

  if (require === 'DM' && role === 'DM') {
    return <>{children}</>;
  }

  if (require === 'PLAYER' && role === 'PLAYER') {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
