import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Activity, BookOpen, Shield, Sparkles, Sword, Users } from "lucide-react";

const sections = [
  { to: "/reference/conditions", title: "Conditions", desc: "Quick reference for the 15 SRD conditions.", icon: Shield },
  { to: "/reference/rules", title: "Rules", desc: "Core 5e rules from the SRD 2024.", icon: BookOpen },
  { to: "/reference/classes", title: "Classes", desc: "Browse the 12 SRD classes and their features.", icon: Sword },
  { to: "/reference/species", title: "Species", desc: "Playable species from the SRD.", icon: Users },
  { to: "/reference/backgrounds", title: "Backgrounds", desc: "Origin backgrounds from the SRD.", icon: Sparkles },
  { to: "/admin/rules-health", title: "Rules API Health", desc: "Live status of the Open5e + SRD APIs.", icon: Activity, admin: true },
];

export default function ReferenceHub() {
  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">5e SRD Reference</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Open 5e SRD reference powered by free public rules APIs (Open5e v2, with the D&amp;D 5e
          SRD API as fallback). This does not include every official D&amp;D book, subclass, monster,
          spell, item, or setting.
        </p>
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.to} to={s.to}>
              <Card className="p-4 h-full hover:bg-accent/30 transition-colors">
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}