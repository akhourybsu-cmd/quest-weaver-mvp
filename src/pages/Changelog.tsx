import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Wrench, Bug, Rocket } from "lucide-react";
import { changelogData, type ChangelogEntry } from "@/data/changelogData";

const changeTypeMeta = {
  feature: { icon: Sparkles, label: "New", color: "bg-green-500/10 text-green-600 border-green-500/30" },
  improvement: { icon: Wrench, label: "Improved", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  fix: { icon: Bug, label: "Fixed", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
};

const Changelog = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
          <div>
            <h1 className="text-3xl font-cinzel font-bold">Changelog</h1>
            <p className="text-muted-foreground text-sm">What's new in Quest Weaver</p>
          </div>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-brand-brass/30" />

          <div className="space-y-8">
            {changelogData.map((entry, idx) => (
              <div key={entry.version} className="relative pl-12">
                {/* Timeline dot */}
                <div className={`absolute left-2 top-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  idx === 0 
                    ? "bg-brand-arcanePurple border-brand-arcanePurple" 
                    : "bg-background border-brand-brass/50"
                }`}>
                  {idx === 0 && <Rocket className="w-3 h-3 text-white" />}
                </div>

                <Card className={`p-6 border-2 ${idx === 0 ? "border-brand-arcanePurple/50" : "border-brand-brass/30"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={`font-mono ${idx === 0 ? "border-brand-arcanePurple text-brand-arcanePurple" : ""}`}
                      >
                        v{entry.version}
                      </Badge>
                      {idx === 0 && (
                        <Badge className="bg-brand-arcanePurple">Latest</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{entry.date}</span>
                  </div>

                  <h2 className="text-xl font-cinzel font-semibold mb-4">{entry.title}</h2>

                  <div className="space-y-3">
                    {entry.changes.map((change, changeIdx) => {
                      const meta = changeTypeMeta[change.type];
                      const Icon = meta.icon;
                      return (
                        <div key={changeIdx} className="flex items-start gap-3">
                          <Badge 
                            variant="outline" 
                            className={`shrink-0 text-xs ${meta.color}`}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {meta.label}
                          </Badge>
                          <span className="text-sm">{change.description}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>More updates coming soon! Check the{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto text-brand-arcanePurple"
              onClick={() => navigate("/community")}
            >
              community forum
            </Button>
            {" "}for feature requests and discussions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Changelog;
