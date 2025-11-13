import { useDemo } from "@/contexts/DemoContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, RotateCcw, X, Eye } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DemoBar() {
  const { isDemo, timeRemaining, endDemo, resetDemo, campaign } = useDemo();
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  if (!isDemo || timeRemaining === null) return null;

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  const timeColor = minutes < 5 ? "text-dragonRed" : minutes < 10 ? "text-brass" : "text-ink";

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-arcanePurple/95 backdrop-blur-sm border-b border-brass/30 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-brass/50 text-ink">
              <Eye className="w-3 h-3 mr-1" />
              Demo Mode
            </Badge>
            {campaign && (
              <span className="text-sm font-medium text-ink">
                {campaign.name}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <Clock className={`w-4 h-4 ${timeColor}`} />
              <span className={timeColor}>
                {minutes}:{seconds.toString().padStart(2, "0")} remaining
              </span>
            </div>
            <span className="text-xs text-ink/70">All changes are temporary</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="text-ink hover:bg-brass/20"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Demo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEndDialog(true)}
              className="text-ink hover:bg-brass/20"
            >
              <X className="w-4 h-4 mr-2" />
              End Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from hiding under the demo bar */}
      <div className="h-12" />

      {/* End Demo Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent className="bg-obsidian border-brass/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cinzel text-ink">End Demo Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-brass">
              This will end your demo session and return you to the homepage. All demo data will be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-brass/30">Continue Demo</AlertDialogCancel>
            <AlertDialogAction onClick={endDemo}>End Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Demo Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-obsidian border-brass/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cinzel text-ink">Reset Demo Data?</AlertDialogTitle>
            <AlertDialogDescription className="text-brass">
              This will restore The Reckoning campaign to its original state. All your changes will
              be lost, but you'll get a fresh 30 minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-brass/30">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetDemo}>Reset to Original</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
