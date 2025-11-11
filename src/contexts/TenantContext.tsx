import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TenantContextValue {
  campaignId: string | null;
  sessionId: string | null;
  isDemo: boolean;
  demoId: string | null;
  userId: string | null;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ campaignId?: string; sessionId?: string; demoId?: string }>();
  
  const isDemo = !!params.demoId;
  const campaignId = params.campaignId || null;
  const sessionId = params.sessionId || null;
  const demoId = params.demoId || null;

  // Get userId from auth
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
    });
  }, []);

  return (
    <TenantContext.Provider value={{ campaignId, sessionId, isDemo, demoId, userId }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
