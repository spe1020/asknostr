import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Zap } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthor } from '@/hooks/useAuthor';
import { useEventCounts } from '@/hooks/useEventCounts';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NoteContent } from '@/components/NoteContent';

interface QuestionCardProps {
  event: NostrEvent;
  onClick?: () => void;
  showFullContent?: boolean;
}

export function QuestionCard({
  event,
  onClick,
  showFullContent = false
}: QuestionCardProps) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const { replyCount, zapCount } = useEventCounts(event.id);

  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const nip05 = metadata?.nip05;
  const profileImage = metadata?.picture;

  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });

  // Truncate content for preview (first 280 characters)
  const truncatedContent = showFullContent
    ? event.content
    : event.content.length > 280
      ? event.content.slice(0, 280) + '...'
      : event.content;

  return (
    <Card
      className={`transition-colors ${onClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
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
          <Badge variant="outline" className="text-xs">
            #asknostr
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="whitespace-pre-wrap break-words">
            <NoteContent
              event={{ ...event, content: truncatedContent }}
              className="text-sm leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">{replyCount}</span>
              </Button>

              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Zap className="h-4 w-4 mr-1" />
                <span className="text-xs">{zapCount}</span>
              </Button>
            </div>

            {onClick && !showFullContent && event.content.length > 280 && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                Read more
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}