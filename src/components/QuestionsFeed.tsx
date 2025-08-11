import { useState } from 'react';
import { RotateCcw, HelpCircle } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAskNostrQuestions, type SortOption } from '@/hooks/useAskNostrQuestions';
import { QuestionCard } from '@/components/QuestionCard';

interface QuestionsFeedProps {
  onQuestionClick: (event: NostrEvent) => void;
}

export function QuestionsFeed({ onQuestionClick }: QuestionsFeedProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const { data: questions, isLoading, error, refetch } = useAskNostrQuestions({ sortBy });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger className="w-40">
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
      <div className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                </CardContent>
              </Card>
            ))}
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
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                event={question}
                onClick={() => onQuestionClick(question)}
                showFullContent={false}
              />
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
    </div>
  );
}