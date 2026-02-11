import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';

const PreferencesSection = () => {
  return (
    <Card className="fantasy-border-ornaments rounded-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="font-cinzel text-2xl text-brass tracking-wide">Preferences</CardTitle>
        <CardDescription>Customize your Quest Weaver experience</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/20">
          <Settings2 className="w-5 h-5 text-brass shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Theme & navigation preferences coming soon</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dark/light theme toggle and default landing page settings will be available in a future update.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesSection;
