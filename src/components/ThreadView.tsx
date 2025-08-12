import { ArrowLeft, RotateCcw, MessageCircle } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useThreadReplies, type ReplySortOption } from '@/hooks/useThreadReplies';
import { QuestionCard } from '@/components/QuestionCard';
import { ReplyCard } from '@/components/ReplyCard';
import { ReplyForm } from '@/components/ReplyForm';
import { RelaySelector } from '@/components/RelaySelector';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileButton } from '@/components/MobileLayout';

interface ThreadViewProps {
  rootEvent: NostrEvent;
  onBack: () => void;
}

export function ThreadView({ rootEvent, onBack }: ThreadViewProps) {
  const [sortBy, setSortBy] = useState<ReplySortOption>('chronological');
  const { data: replies, isLoading, error, refetch } = useThreadReplies({
    rootEventId: rootEvent.id,
    sortBy,
  });
  const isMobile = useIsMobile();

  const handleRefresh = () => {
    refetch();
  };

  const handleReplySuccess = () => {
    // Refresh the thread after a successful reply
    setTimeout(() => refetch(), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className={isMobile ? "hidden sm:inline" : ""}>Back to Questions</span>
        </Button>

        <div className="flex items-center space-x-2">
          {isMobile ? (
            <MobileButton
              variant="outline"
              size="small"
              onClick={handleRefresh}
              className="h-10 w-10 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </MobileButton>
          ) : (
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}

          <Select value={sortBy} onValueChange={(value: ReplySortOption) => setSortBy(value)}>
            <SelectTrigger className={isMobile ? "w-32" : "w-40"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chronological">Oldest First</SelectItem>
              <SelectItem value="zap-ranked">Most Zapped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Root Question Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <h2 className="text-lg font-semibold">Question</h2>
        </div>
        <QuestionCard
          event={rootEvent}
          showFullContent={true}
        />
      </div>

      {/* Reply Form */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Add Your Answer</h3>
        </div>
        <ReplyForm rootEvent={rootEvent} onSuccess={handleReplySuccess} />
      </div>

      {/* Replies Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">Answers</h3>
            {replies && replies.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({replies.length} {replies.length === 1 ? 'answer' : 'answers'})
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-l-4 border-l-primary/20 ml-4">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-4">
                <p className="text-muted-foreground">
                  Failed to load answers. Try another relay?
                </p>
                <RelaySelector className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && replies && replies.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-4">
                <p className="text-muted-foreground">
                  No answers yet. Be the first to answer this question!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Replies List */}
        {replies && replies.length > 0 && (
          <div className="space-y-4">
            {replies.map((reply, index) => (
              <div key={reply.id}>
                <ReplyCard event={reply} />
                {index < replies.length - 1 && (
                  <Separator className="my-4 ml-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}