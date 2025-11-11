import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface XPProgressBarProps {
  currentXP: number;
  level: number;
}

// RAW: XP thresholds by level (PHB 15)
const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

export function XPProgressBar({ currentXP, level }: XPProgressBarProps) {
  const currentThreshold = XP_THRESHOLDS[level] || 0;
  const nextThreshold = XP_THRESHOLDS[level + 1];

  // Max level reached
  if (!nextThreshold) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Experience Points
          </span>
          <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-yellow-600">
            MAX LEVEL
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {currentXP.toLocaleString()} XP
        </div>
      </div>
    );
  }

  const xpSinceLastLevel = currentXP - currentThreshold;
  const xpNeededForNextLevel = nextThreshold - currentThreshold;
  const progressPercent = (xpSinceLastLevel / xpNeededForNextLevel) * 100;

  const isLevelUpReady = currentXP >= nextThreshold;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          Experience Points
        </span>
        {isLevelUpReady && (
          <Badge variant="default" className="animate-pulse bg-gradient-to-r from-green-500 to-green-600">
            LEVEL UP!
          </Badge>
        )}
      </div>
      
      <Progress 
        value={Math.min(progressPercent, 100)} 
        className="h-3"
      />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {currentXP.toLocaleString()} / {nextThreshold.toLocaleString()} XP
        </span>
        <span>
          Level {level} → {level + 1}
        </span>
      </div>
      
      {!isLevelUpReady && (
        <div className="text-xs text-muted-foreground text-center">
          {(nextThreshold - currentXP).toLocaleString()} XP to next level
        </div>
      )}
    </div>
  );
}
