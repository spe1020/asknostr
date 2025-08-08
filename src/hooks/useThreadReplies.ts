import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { countHashtags } from '@/lib/utils';

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

      // Filter out posts with too many hashtags (spam prevention)
      const filteredEvents = events.filter(event => {
        const hashtagCount = countHashtags(event.content);
        return hashtagCount <= 3;
      });

      // Sort based on the selected option
      switch (sortBy) {
        case 'chronological':
          return filteredEvents.sort((a, b) => a.created_at - b.created_at);

        case 'zap-ranked':
          // Sort by zap count (descending), then by creation time (newest first for same zap count)
          return filteredEvents.sort((a, b) => {
            // Get zap counts for comparison
            const aZaps = a.tags.filter(tag => tag[0] === 'zap').length;
            const bZaps = b.tags.filter(tag => tag[0] === 'zap').length;
            
            if (aZaps !== bZaps) {
              return bZaps - aZaps; // Higher zap count first
            }
            
            // If zap counts are equal, sort by creation time (newest first)
            return b.created_at - a.created_at;
          });

        default:
          return filteredEvents.sort((a, b) => a.created_at - b.created_at);
      }
    },
    enabled: !!rootEventId,
    staleTime: 30000, // 30 seconds
  });
}