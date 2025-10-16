import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { seedDevelopmentCombat, cleanupSeedData } from "@/data/seedCombatData";
import { Sprout, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

/**
 * DEV ONLY: Seed Combat Data Button
 * Creates a test encounter with 4 PCs and 2 monsters for development
 */
export const SeedCombatButton = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastSeedId, setLastSeedId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useIsAdmin();

  // Only render for admins
  if (!isAdmin) {
    return null;
  }

  const handleSeed = async () => {
    setIsSeeding(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "You must be logged in to seed data",
          variant: "destructive",
        });
        return;
      }

      const result = await seedDevelopmentCombat(user.id);
      
      if (result) {
        setLastSeedId(result.campaign_id);
        toast({
          title: "✨ Combat Seeded!",
          description: `Created encounter with ${result.character_ids.length} PCs and ${result.monster_ids.length} monsters`,
        });
        
        // Navigate to the new session
        window.location.href = `/session/dm?campaign=${result.campaign_id}`;
      } else {
        toast({
          title: "Seeding failed",
          description: "Check console for details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Seed error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCleanup = async () => {
    if (!lastSeedId) return;

    try {
      await cleanupSeedData(lastSeedId);
      setLastSeedId(null);
      toast({
        title: "Cleaned up",
        description: "Seed data removed",
      });
      
      // Navigate back to hub
      window.location.href = "/campaign-hub";
    } catch (error) {
      toast({
        title: "Cleanup failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      <Button
        onClick={handleSeed}
        disabled={isSeeding}
        variant="outline"
        size="sm"
        className="shadow-lg"
      >
        <Sprout className="w-4 h-4 mr-2" />
        {isSeeding ? "Seeding..." : "Seed Combat"}
      </Button>

      {lastSeedId && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="shadow-lg">
              <Trash2 className="w-4 h-4 mr-2" />
              Cleanup
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove seed data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the test campaign and all associated data (characters, monsters, encounters).
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCleanup}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
