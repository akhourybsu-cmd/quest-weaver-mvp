import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, BookOpen, Sparkles } from "lucide-react";
import CharacterCard from "@/components/character/CharacterCard";
import CharacterWizard from "@/components/character/CharacterWizard";

const CharacterList = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editCharacterId, setEditCharacterId] = useState<string | null>(null);

  useEffect(() => {
    loadCharacters();
  }, [campaignId]);

  const loadCharacters = async () => {
    if (!campaignId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }

      const { data, error } = await supabase
        .from("characters")
        .select("*, srd_subclasses(name)")
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCharacters(
        (data || []).map((char: any) => ({
          ...char,
          subclass_name: char.srd_subclasses?.name || null,
        }))
      );
    } catch (error) {
      console.error("Error loading characters:", error);
      toast({ title: "Error", description: "Failed to load characters", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="h-8 w-8 text-brass animate-pulse-breathe" />
          <p className="font-cinzel text-brass tracking-widest text-sm uppercase">
            Consulting the Archives…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top navigation bar ── */}
      <header className="border-b border-brass/20 bg-card/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/campaign/${campaignId}`)}
            className="gap-2 text-muted-foreground hover:text-brass hover:bg-brass/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline font-cinzel tracking-wide text-xs uppercase">Back to Campaign</span>
          </Button>

          <Button
            onClick={() => { setEditCharacterId(null); setShowWizard(true); }}
            className="gap-2 bg-gradient-to-r from-brass/80 to-brass hover:from-brass hover:to-brass/90 text-black font-cinzel tracking-wide text-xs uppercase active:scale-95 transition-all shadow-md"
          >
            <Plus className="h-4 w-4" />
            New Character
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-6xl">

        {/* ── Page hero ── */}
        <div className="mb-10 text-center">
          <p className="font-cinzel text-brass/60 tracking-[0.3em] text-xs uppercase mb-3">
            Campaign Roster
          </p>
          <h1 className="font-cinzel font-bold text-4xl md:text-5xl text-foreground mb-3 tracking-wide">
            My Characters
          </h1>
          <p className="text-muted-foreground font-cormorant text-lg italic max-w-md mx-auto">
            Every legend begins with a single step into the unknown.
          </p>

          {/* Decorative brass divider */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-brass/50" />
            <div className="w-2 h-2 rotate-45 bg-brass/70 rounded-sm" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-brass/50" />
          </div>
        </div>

        {/* ── Character grid or empty state ── */}
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 animate-fade-in">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-brass/10 border border-brass/20 flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-brass/50" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brass/20 border border-brass/30 flex items-center justify-center">
                <Plus className="h-3 w-3 text-brass" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="font-cinzel font-semibold text-xl text-foreground mb-2">
                Your Tale Awaits
              </h2>
              <p className="text-muted-foreground font-cormorant italic text-base max-w-xs">
                No adventurers have answered the call yet. Create your first character to begin the journey.
              </p>
            </div>
            <Button
              onClick={() => { setEditCharacterId(null); setShowWizard(true); }}
              size="lg"
              className="gap-2 bg-gradient-to-r from-brass/80 to-brass hover:from-brass hover:to-brass/90 text-black font-cinzel tracking-wider text-sm uppercase active:scale-95 transition-all shadow-lg px-8"
            >
              <Sparkles className="h-4 w-4" />
              Begin Your Legend
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground font-cinzel tracking-widest uppercase mb-6 text-center">
              {characters.length} {characters.length === 1 ? "Adventurer" : "Adventurers"} Recorded
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {characters.map((character, idx) => (
                <div
                  key={character.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <CharacterCard
                    character={character}
                    campaignId={campaignId!}
                    onResumeCreation={(id) => {
                      setEditCharacterId(id);
                      setShowWizard(true);
                    }}
                    onDelete={loadCharacters}
                    onRefresh={loadCharacters}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <CharacterWizard
        open={showWizard}
        campaignId={campaignId || null}
        editCharacterId={editCharacterId}
        onComplete={() => {
          setShowWizard(false);
          setEditCharacterId(null);
          loadCharacters();
        }}
      />
    </div>
  );
};

export default CharacterList;
