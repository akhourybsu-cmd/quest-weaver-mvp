import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Clock } from 'lucide-react';

interface ForumIdentitySectionProps {
  name: string;
  avatarUrl: string | null;
  color: string;
}

const ForumIdentitySection = ({ name, avatarUrl, color }: ForumIdentitySectionProps) => {
  return (
    <Card className="fantasy-border-ornaments rounded-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="font-cinzel text-2xl text-brass tracking-wide">Forum Identity</CardTitle>
        <CardDescription>This is how you appear in the Community Forum</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview of forum post appearance */}
        <div className="p-4 rounded-lg border border-border bg-muted/20">
          <p className="text-xs text-muted-foreground mb-3 font-cinzel">Preview</p>
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 border-2 border-brass/30">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback style={{ backgroundColor: color }} className="text-sm font-bold text-white">
                {name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{name || 'Your Name'}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  just now
                </span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                This is what your forum posts will look like...
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-brass" />
          <p>
            Your display name and avatar from the Profile section above are used across all forum posts and replies. Changes take effect immediately.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForumIdentitySection;
