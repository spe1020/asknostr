import { formatDistanceToNow, format } from 'date-fns';
import { MessageCircle, Clock } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthor } from '@/hooks/useAuthor';
import { useEventCounts } from '@/hooks/useEventCounts';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NoteContent } from '@/components/NoteContent';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ZapButton } from '@/components/ZapButton';

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
  const { replyCount } = useEventCounts(event.id);
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLDivElement>(null);

  // Touch gestures for mobile
  const { attachGestures } = useTouchGestures({
    onLongPress: () => {
      // Show context menu or additional actions on long press
      console.log('Long press detected');
    },
    preventDefault: false,
  });

  useEffect(() => {
    if (cardRef.current && isMobile) {
      return attachGestures(cardRef.current);
    }
  }, [attachGestures, isMobile]);

  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const nip05 = metadata?.nip05;
  const profileImage = metadata?.picture;
  const about = metadata?.about;

  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });
  const exactTime = format(new Date(event.created_at * 1000), 'MMM d, yyyy \'at\' h:mm a');

  // Truncate content for preview (first 280 characters)
  const truncatedContent = showFullContent
    ? event.content
    : event.content.length > 280
      ? event.content.slice(0, 280) + '...'
      : event.content;

  return (
    <Card
      ref={cardRef}
      className={`transition-all duration-200 ${
        onClick 
          ? 'cursor-pointer hover:shadow-md hover:border-primary/30' 
          : 'shadow-sm'
      } ${isMobile ? 'active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm truncate">{displayName}</span>
                {nip05 && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {nip05}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground cursor-help">
                        {timeAgo}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{exactTime}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
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

          {about && showFullContent && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              <span className="font-medium">About {displayName}:</span> {about}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-8 px-3",
                  isMobile && "h-10 px-4" // Larger touch target on mobile
                )}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="text-xs font-medium">{replyCount} {replyCount === 1 ? 'answer' : 'answers'}</span>
              </Button>

              <div onClick={(e) => e.stopPropagation()}>
                <ZapButton 
                  target={event}
                  className={cn(
                    "h-8 px-3",
                    isMobile && "h-10 px-4" // Larger touch target on mobile
                  )}
                  showCount={true}
                />
              </div>
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