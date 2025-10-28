import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if the current user is the DM of a specific campaign
 */
export function useIsDM(campaignId: string | null) {
  const [isDM, setIsDM] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDMStatus = async () => {
      if (!campaignId) {
        setIsDM(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsDM(false);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('campaigns')
          .select('dm_user_id')
          .eq('id', campaignId)
          .single();
        
        if (error) {
          console.error('Error checking DM status:', error);
          setIsDM(false);
        } else {
          setIsDM(data?.dm_user_id === user.id);
        }
      } catch (error) {
        console.error('Error checking DM status:', error);
        setIsDM(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDMStatus();
  }, [campaignId]);

  return { isDM, isLoading };
}
