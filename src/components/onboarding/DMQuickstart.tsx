import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Swords, 
  Users, 
  Heart, 
  Zap, 
  Shield, 
  BookOpen,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react";

interface QuickstartStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

const QUICKSTART_STEPS: QuickstartStep[] = [
  {
    title: "Welcome, Dungeon Master!",
    description: "This quick guide will help you get started with your first combat encounter.",
    icon: <BookOpen className="w-12 h-12 text-primary" aria-hidden="true" />,
    tips: [
      "Navigate using the tabs: Party, Combat, and Map",
      "Keyboard shortcuts: [ and ] to navigate turns",
      "All actions are tracked in the Combat Log"
    ]
  },
  {
    title: "Managing Your Party",
    description: "Players join using your campaign code. Monitor their status from the Party tab.",
    icon: <Users className="w-12 h-12 text-primary" aria-hidden="true" />,
    tips: [
      "View party HP, AC, and passive perception at a glance",
      "Apply quick damage/healing with the +/- buttons",
      "Manage party-wide short and long rests"
    ]
  },
  {
    title: "Starting Combat",
    description: "Click 'Start Combat' to begin an encounter. Add monsters from the library.",
    icon: <Swords className="w-12 h-12 text-primary" aria-hidden="true" />,
    tips: [
      "Add monsters from the Monster Library",
      "Roll initiative for all combatants",
      "Use Prev/Next Turn to advance combat (or [ ] keys)",
      "Round counter increments automatically"
    ]
  },
  {
    title: "HP & Damage",
    description: "Apply damage that automatically handles resistances, vulnerabilities, and immunities.",
    icon: <Heart className="w-12 h-12 text-status-hp" aria-hidden="true" />,
    tips: [
      "Damage calculations factor in RVI automatically",
      "Temp HP is consumed before regular HP",
      "Death saves tracked for unconscious characters",
      "Concentration checks prompt on damage"
    ]
  },
  {
    title: "Conditions & Effects",
    description: "Track conditions, spell effects, and durations with automatic expiry.",
    icon: <Zap className="w-12 h-12 text-status-buff" aria-hidden="true" />,
    tips: [
      "Quick-apply common conditions (Blinded, Prone, etc.)",
      "Set duration in rounds for auto-expiry",
      "Effects tick down at end of round",
      "Concentration tracked automatically"
    ]
  },
  {
    title: "Saving Throws",
    description: "Prompt players for saves directly through their character sheets.",
    icon: <Shield className="w-12 h-12 text-primary" aria-hidden="true" />,
    tips: [
      "Send save prompts to all targets or specific characters",
      "Players roll directly in their view",
      "Results appear in your Combat Log",
      "Half damage on success option available"
    ]
  }
];

export function DMQuickstart() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenQuickstart, setHasSeenQuickstart] = useState(false);

  useEffect(() => {
    // Check if user has seen quickstart
    const seen = localStorage.getItem("dm_quickstart_seen");
    if (!seen) {
      setOpen(true);
    } else {
      setHasSeenQuickstart(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("dm_quickstart_seen", "true");
    setHasSeenQuickstart(true);
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < QUICKSTART_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReopen = () => {
    setCurrentStep(0);
    setOpen(true);
  };

  const step = QUICKSTART_STEPS[currentStep];

  return (
    <>
      {hasSeenQuickstart && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReopen}
          className="gap-2"
          aria-label="Open DM quickstart guide"
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Quick Guide</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]" aria-describedby="quickstart-description">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">{step.title}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                aria-label="Close quickstart guide"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
            <DialogDescription id="quickstart-description">
              {step.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Icon */}
            <div className="flex justify-center">
              {step.icon}
            </div>

            {/* Tips */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Key Tips
              </h3>
              <ul className="space-y-2" role="list">
                {step.tips.map((tip, index) => (
                  <li key={index} className="flex gap-3">
                    <Badge variant="outline" className="shrink-0 mt-0.5">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Step {currentStep + 1} of {QUICKSTART_STEPS.length}</span>
                <span>{Math.round(((currentStep + 1) / QUICKSTART_STEPS.length) * 100)}% complete</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / QUICKSTART_STEPS.length) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={(currentStep + 1)}
                  aria-valuemin={0}
                  aria-valuemax={QUICKSTART_STEPS.length}
                  aria-label={`Progress: step ${currentStep + 1} of ${QUICKSTART_STEPS.length}`}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="gap-2"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                className="gap-2"
                aria-label={currentStep === QUICKSTART_STEPS.length - 1 ? "Finish guide" : "Next step"}
              >
                {currentStep === QUICKSTART_STEPS.length - 1 ? "Finish" : "Next"}
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full text-xs text-muted-foreground"
              aria-label="Skip quickstart guide"
            >
              Skip guide
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
