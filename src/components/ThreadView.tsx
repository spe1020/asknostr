import { ArrowLeft, RotateCcw } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useThreadReplies, type ReplySortOption } from '@/hooks/useThreadReplies';
import { QuestionCard } from '@/components/QuestionCard';
import { ReplyCard } from '@/components/ReplyCard';
import { ReplyForm } from '@/components/ReplyForm';
import { RelaySelector } from '@/components/RelaySelector';
import { useState } from 'react';

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

  const handleRefresh = () => {
    refetch();
  };

  const handleReplySuccess = () => {
    // Refresh the thread after a successful reply
    setTimeout(() => refetch(), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Questions
        </Button>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Select value={sortBy} onValueChange={(value: ReplySortOption) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chronological">Chronological</SelectItem>
              <SelectItem value="zap-ranked">Zap Ranked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Root Question */}
      <QuestionCard
        event={rootEvent}
        showFullContent={true}
      />

      {/* Reply Form */}
      <ReplyForm rootEvent={rootEvent} onSuccess={handleReplySuccess} />

      {/* Replies Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Replies {replies && `(${replies.length})`}
          </h3>
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
                  Failed to load replies. Try another relay?
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
                  No replies yet. Be the first to answer!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Replies List */}
        {replies && replies.length > 0 && (
          <div className="space-y-4">
            {replies.map((reply) => (
              <ReplyCard key={reply.id} event={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}