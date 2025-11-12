import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface SessionTimerProps {
  startedAt: string;
  pausedAt?: string | null;
  pausedDuration?: number;
  status: "live" | "paused";
}

export function SessionTimer({ startedAt, pausedAt, pausedDuration = 0, status }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      
      if (status === "paused" && pausedAt) {
        const pauseTime = new Date(pausedAt).getTime();
        return Math.floor((pauseTime - start - (pausedDuration * 1000)) / 1000);
      }
      
      return Math.floor((now - start - (pausedDuration * 1000)) / 1000);
    };

    setElapsed(calculateElapsed());

    if (status === "live") {
      const interval = setInterval(() => {
        setElapsed(calculateElapsed());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startedAt, pausedAt, pausedDuration, status]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const timeString = hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;

  return (
    <div className="flex items-center gap-2 text-base font-semibold text-foreground">
      <Clock className="w-5 h-5 text-brass" />
      <span className="tabular-nums">{timeString}</span>
    </div>
  );
}
