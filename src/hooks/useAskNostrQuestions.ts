import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';


export type SortOption = 'recent' | 'most-replied' | 'most-zapped';

interface UseAskNostrQuestionsOptions {
  sortBy?: SortOption;
  limit?: number;
}

export function useAskNostrQuestions(options: UseAskNostrQuestionsOptions = {}) {
  const { sortBy = 'recent', limit = 50 } = options;
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['asknostr-questions', sortBy, limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Fetch root-level asknostr questions (no "e" tags = no replies)
      const events = await nostr.query([{
        kinds: [1],
        '#t': ['asknostr'],
        limit,
      }], { signal });

      // Filter out replies (events with "e" tags)
      const rootQuestions = events.filter(event =>
        !event.tags.some(tag => tag[0] === 'e')
      );

      // Sort based on the selected option
      switch (sortBy) {
        case 'recent':
          return rootQuestions.sort((a, b) => b.created_at - a.created_at);

        case 'most-replied':
          // For now, we'll sort by recent. Reply counting would require additional queries
          // TODO: Implement reply counting in a separate hook
          return rootQuestions.sort((a, b) => b.created_at - a.created_at);

        case 'most-zapped':
          // For now, we'll sort by recent. Zap counting would require additional queries
          // TODO: Implement zap counting in a separate hook
          return rootQuestions.sort((a, b) => b.created_at - a.created_at);

        default:
          return rootQuestions.sort((a, b) => b.created_at - a.created_at);
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}