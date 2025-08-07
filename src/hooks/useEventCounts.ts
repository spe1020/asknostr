import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

interface EventCounts {
  replyCount: number;
  zapCount: number;
}

export function useEventCounts(eventId: string): EventCounts {
  const { nostr } = useNostr();

  const { data: replies = [] } = useQuery({
    queryKey: ['event-replies', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // Fetch replies (kind 1 events that reference this event)
      const events = await nostr.query([{
        kinds: [1],
        '#e': [eventId],
        limit: 100,
      }], { signal });
      
      return events;
    },
    enabled: !!eventId,
    staleTime: 30000, // 30 seconds
  });

  const { data: zaps = [] } = useQuery({
    queryKey: ['event-zaps', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // Fetch zaps (kind 9735 events that reference this event)
      const events = await nostr.query([{
        kinds: [9735],
        '#e': [eventId],
        limit: 100,
      }], { signal });
      
      return events;
    },
    enabled: !!eventId,
    staleTime: 30000, // 30 seconds
  });

  return {
    replyCount: replies.length,
    zapCount: zaps.length,
  };
}