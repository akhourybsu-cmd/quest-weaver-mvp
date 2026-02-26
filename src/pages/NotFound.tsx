import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <Compass className="w-16 h-16 text-brass mx-auto mb-6 animate-pulse" />
        <h1 className="mb-2 text-5xl font-cinzel font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl font-cinzel text-muted-foreground">
          You've wandered off the map...
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          The path you seek does not exist in this realm.
        </p>
        <Button asChild className="bg-brass hover:bg-brass/90 text-brass-foreground">
          <a href="/">Return to Camp</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
