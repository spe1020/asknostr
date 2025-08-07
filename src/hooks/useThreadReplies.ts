import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';


export type ReplySortOption = 'chronological' | 'zap-ranked';

interface UseThreadRepliesOptions {
  rootEventId: string;
  sortBy?: ReplySortOption;
  limit?: number;
}

export function useThreadReplies(options: UseThreadRepliesOptions) {
  const { rootEventId, sortBy = 'chronological', limit = 100 } = options;
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['thread-replies', rootEventId, sortBy, limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Fetch all direct replies to the root question
      const events = await nostr.query([{
        kinds: [1],
        '#e': [rootEventId],
        limit,
      }], { signal });

      // Sort based on the selected option
      switch (sortBy) {
        case 'chronological':
          return events.sort((a, b) => a.created_at - b.created_at);

        case 'zap-ranked':
          // For now, we'll sort chronologically. Zap ranking would require additional queries
          // TODO: Implement zap ranking
          return events.sort((a, b) => a.created_at - b.created_at);

        default:
          return events.sort((a, b) => a.created_at - b.created_at);
      }
    },
    enabled: !!rootEventId,
    staleTime: 30000, // 30 seconds
  });
}