import { useMutation } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';
import type { EventTemplate } from 'nostr-tools';

interface AnonymousPostOptions {
  content: string;
  tags?: string[][];
  kind?: number;
}

export function useAnonymousPost() {
  const { nostr } = useNostr();

  return useMutation({
    mutationFn: async (options: AnonymousPostOptions) => {
      const { content, tags = [], kind = 1 } = options;
      
      // Generate ephemeral keypair for anonymous posting
      const secretKey = generateSecretKey();
      const publicKey = getPublicKey(secretKey);

      // Create event template
      const eventTemplate: EventTemplate = {
        kind,
        content,
        tags: [
          ...tags,
          ['client', 'AskNostr'], // Add client tag
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      // Sign the event with the ephemeral key
      const signedEvent = finalizeEvent(eventTemplate, secretKey);

      // Publish the event
      await nostr.event(signedEvent);

      return {
        event: signedEvent,
        publicKey,
        // Note: We don't return the secret key for security
      };
    },
  });
}