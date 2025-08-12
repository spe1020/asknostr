import { useState } from 'react';
import { RotateCcw, HelpCircle, Loader2 } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAskNostrQuestions, type SortOption } from '@/hooks/useAskNostrQuestions';
import { QuestionCard } from '@/components/QuestionCard';
import { QuestionCardSkeleton } from '@/components/QuestionCardSkeleton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileButton } from '@/components/MobileLayout';

interface QuestionsFeedProps {
  onQuestionClick: (event: NostrEvent) => void;
}

export function QuestionsFeed({ onQuestionClick }: QuestionsFeedProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const { data: questions, isLoading, error, refetch, isRefetching } = useAskNostrQuestions({ sortBy });
  const isMobile = useIsMobile();

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between space-x-2">
        {/* Mobile: Full-width refresh button */}
        {isMobile ? (
          <MobileButton
            variant="outline"
            fullWidth
            onClick={handleRefresh}
            disabled={isRefetching}
            className="flex-1"
          >
            {isRefetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Refresh
              </>
            )}
          </MobileButton>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefetching}
            className="min-w-[80px]"
          >
            {isRefetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        )}

        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger className={isMobile ? "w-full" : "w-40"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="most-replied">Most Replied (12h)</SelectItem>
            <SelectItem value="most-zapped">Most Zapped (12h)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Context indicator for time-based sorting */}
      {(sortBy === 'most-replied' || sortBy === 'most-zapped') && (
        <div className="text-xs text-muted-foreground text-right">
          Based on activity from the past 12 hours
        </div>
      )}

      {/* Questions List */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {/* Initial loading with staggered animation */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="opacity-0 animate-in fade-in-0 slide-in-from-y-2"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <QuestionCardSkeleton />
                </div>
              ))}
              
              {/* Loading indicator at bottom */}
              <div className="flex justify-center py-8">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">Loading questions...</span>
                </div>
              </div>
            </div>
          )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="p-6 text-center">
              <div className="space-y-2">
                <HelpCircle className="h-12 w-12 text-destructive mx-auto" />
                <h3 className="text-lg font-semibold text-destructive">Failed to load questions</h3>
                <p className="text-muted-foreground">
                  {error.message || 'An error occurred while loading questions.'}
                </p>
                <Button onClick={handleRefresh} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        {questions && questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="opacity-0 animate-in fade-in-0 slide-in-from-y-2"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <QuestionCard
                  event={question}
                  onClick={() => onQuestionClick(question)}
                  showFullContent={false}
                />
              </div>
            ))}
          </div>
        ) : !isLoading && !error ? (
          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No questions yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to ask a question! Use the form above to get started.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
        </div>
      </PullToRefresh>
    </div>
  );
}