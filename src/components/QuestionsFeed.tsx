import { useState } from 'react';
import { RotateCcw, Plus } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAskNostrQuestions, type SortOption } from '@/hooks/useAskNostrQuestions';
import { QuestionCard } from '@/components/QuestionCard';
import { PostQuestionForm } from '@/components/PostQuestionForm';
import { RelaySelector } from '@/components/RelaySelector';
import { QuickSignup } from '@/components/QuickSignup';
import { AskNostrInfo } from '@/components/AskNostrInfo';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface QuestionsFeedProps {
  onQuestionClick: (event: NostrEvent) => void;
}

export function QuestionsFeed({ onQuestionClick }: QuestionsFeedProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showPostForm, setShowPostForm] = useState(false);
  const { user } = useCurrentUser();

  const { data: questions, isLoading, error, refetch } = useAskNostrQuestions({
    sortBy,
    limit: 50,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handlePostSuccess = () => {
    setShowPostForm(false);
    // Refresh the feed after a successful post
    setTimeout(() => refetch(), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">#asknostr</h1>
          <p className="text-muted-foreground">
            Decentralized Q&A on Nostr
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="most-replied">Most Replied</SelectItem>
              <SelectItem value="most-zapped">Most Zapped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Signup for logged out users */}
      {!user && <QuickSignup />}

      {/* Post Question Form */}
      <Collapsible open={showPostForm} onOpenChange={setShowPostForm}>
        <CollapsibleTrigger asChild>
          <Button className="w-full gap-2" variant={showPostForm ? "secondary" : "default"}>
            <Plus className="h-4 w-4" />
            {showPostForm ? 'Hide Form' : 'Ask a Question'}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <PostQuestionForm onSuccess={handlePostSuccess} />
        </CollapsibleContent>
      </Collapsible>

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
          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <p className="text-muted-foreground">
                  Failed to load questions. Try another relay?
                </p>
                <RelaySelector className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && questions && questions.length === 0 && (
          <div className="space-y-4">
            <AskNostrInfo />
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      No questions found on this relay.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try switching relays or be the first to ask a question!
                    </p>
                  </div>
                  <RelaySelector className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Questions List */}
        {questions && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                event={question}
                onClick={() => onQuestionClick(question)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}