import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if the current user has admin role
 * Uses server-side security definer function for secure role checking
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.rpc('is_current_user_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading };
}
