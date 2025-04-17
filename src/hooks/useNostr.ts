import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';

// Hook for fetching Nostr events based on filters
export function useNostrQuery(filters: NostrFilter[], options = {}) {
  const { nostr } = useNostr();

  return useQuery<NostrEvent[]>({
    queryKey: ['nostr', JSON.stringify(filters)],
    queryFn: async () => {
      if (!nostr) return [];
      return await nostr.query(filters);
    },
    ...options,
  });
}

// Hook for publishing Nostr events
export function useNostrPublish() {
  const { nostr } = useNostr();

  const publish = async (event: NostrEvent) => {
    if (!nostr) throw new Error('Nostr context not available');
    return await nostr.event(event);
  };

  return { publish };
}

// Export the useNostr hook as well for direct access to the pool
export { useNostr };