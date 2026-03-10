import { useState, useEffect } from "react";
import { Scroll, MapPin, Users, Swords, BookOpen, Sparkles } from "lucide-react";

const LOADING_STEPS = [
  { icon: Scroll, text: "Preparing your campaign folio..." },
  { icon: Users, text: "Populating NPCs..." },
  { icon: MapPin, text: "Charting locations..." },
  { icon: Swords, text: "Staging encounters..." },
  { icon: BookOpen, text: "Inscribing lore..." },
  { icon: Sparkles, text: "Weaving the narrative..." },
];

interface DemoLoadingScreenProps {
  campaignName: string;
  onComplete: () => void;
}

export function DemoLoadingScreen({ campaignName, onComplete }: DemoLoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= LOADING_STEPS.length - 1) {
          clearInterval(stepInterval);
          setTimeout(() => setFadeOut(true), 400);
          setTimeout(() => onComplete(), 900);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(stepInterval);
  }, [onComplete]);

  const progress = ((currentStep + 1) / LOADING_STEPS.length) * 100;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-obsidian flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Parchment-style centered card */}
      <div className="relative max-w-md w-full mx-4">
        {/* Decorative top border */}
        <div className="h-1 bg-gradient-to-r from-transparent via-brass to-transparent rounded-full mb-8" />

        {/* Campaign name reveal */}
        <h1 className="font-cinzel text-2xl md:text-3xl text-ink text-center mb-2 tracking-wide">
          {campaignName}
        </h1>
        <p className="text-brass/60 text-center text-sm mb-8 font-cinzel tracking-widest uppercase">
          Demo Campaign
        </p>

        {/* Progress bar */}
        <div className="relative h-1.5 bg-brass/10 rounded-full overflow-hidden mb-6">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-arcanePurple to-brass rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="space-y-3">
          {LOADING_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isDone = index < currentStep;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isActive
                    ? "text-ink opacity-100 translate-x-1"
                    : isDone
                    ? "text-brass/40 opacity-60"
                    : "text-brass/20 opacity-30"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "animate-pulse" : ""}`} />
                <span className="text-sm">{step.text}</span>
                {isDone && <span className="text-brass/40 text-xs ml-auto">✓</span>}
              </div>
            );
          })}
        </div>

        {/* Decorative bottom border */}
        <div className="h-1 bg-gradient-to-r from-transparent via-brass to-transparent rounded-full mt-8" />
      </div>
    </div>
  );
}
