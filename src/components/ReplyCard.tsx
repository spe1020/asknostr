import { formatDistanceToNow } from 'date-fns';
import { Zap } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthor } from '@/hooks/useAuthor';
import { useEventCounts } from '@/hooks/useEventCounts';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NoteContent } from '@/components/NoteContent';

interface ReplyCardProps {
  event: NostrEvent;
}

export function ReplyCard({ event }: ReplyCardProps) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const { zapCount } = useEventCounts(event.id);

  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const nip05 = metadata?.nip05;
  const profileImage = metadata?.picture;

  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });

  return (
    <Card className="border-l-4 border-l-primary/20 ml-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="text-xs">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{displayName}</span>
                {nip05 && (
                  <Badge variant="secondary" className="text-xs">
                    {nip05}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="whitespace-pre-wrap break-words">
            <NoteContent event={event} className="text-sm leading-relaxed" />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Zap className="h-4 w-4 mr-1" />
              <span className="text-xs">{zapCount}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}