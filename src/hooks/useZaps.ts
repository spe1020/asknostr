import { useState } from 'react';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/useToast';
import { nip57, nip19, Event } from 'nostr-tools';
import type { WebLNProvider } from 'webln';

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

export function useZaps(target: Event, webln: WebLNProvider | null, onZapSuccess?: () => void) {
  const { nostr } = useNostr();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const { mutate: publishEvent } = useNostrPublish();
  const author = useAuthor(target?.pubkey);
  const [isZapping, setIsZapping] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);

  const naddr =
    target.kind >= 30000 && target.kind < 40000
      ? nip19.naddrEncode({
          identifier: target.tags.find((t) => t[0] === 'd')?.[1] || '',
          pubkey: target.pubkey,
          kind: target.kind,
        })
      : undefined;

  const queryKey = naddr ? `naddr:${naddr}` : `event:${target.id}`;

  const { data: zaps, ...query } = useQuery<NostrEvent[], Error>({
    queryKey: ['zaps', queryKey],
    queryFn: async (c) => {
      if (!target.id && !naddr) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);

      const filters: NostrFilter[] = [];

      if (naddr) {
        try {
          const decoded = nip19.decode(naddr);
          if (decoded.type === 'naddr') {
            const { kind, pubkey, identifier } = decoded.data;
            filters.push({
              kinds: [9735],
              '#a': [`${kind}:${pubkey}:${identifier}`],
            });
          }
        } catch (e) {
          console.error("Invalid naddr", naddr, e);
        }
      } else {
        filters.push({
          kinds: [9735],
          '#e': [target.id],
        });
      }

      if (filters.length === 0) return [];

      const events = await nostr.query(filters, { signal });
      return events;
    },
    enabled: !!target.id || !!naddr,
  });

  const zap = async (amount: number, comment: string) => {
    if (amount <= 0) {
      return;
    }

    setIsZapping(true);

    if (!user) {
      toast({
        title: 'Login required',
        description: 'You must be logged in to send a zap.',
        variant: 'destructive',
      });
      setIsZapping(false);
      return;
    }

    try {
      const lud16 = author.data?.metadata?.lud16;
      if (!lud16) {
        toast({
          title: 'Lightning address not found',
          description: 'The author does not have a lightning address configured.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      if (!author.data) {
        toast({
          title: 'Author not found',
          description: 'Could not find the author of this item.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      const zapEndpoint = await nip57.getZapEndpoint(author.data.event as Event);
      if (!zapEndpoint) {
        toast({
          title: 'Zap endpoint not found',
          description: 'Could not find a zap endpoint for the author.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      const zapAmount = amount * 1000; // convert to millisats
      const relays = [config.relayUrl];
      const zapRequest = nip57.makeZapRequest({
        profile: target.pubkey,
        event: target.id,
        amount: zapAmount,
        relays,
        comment: comment,
      });

      if (naddr) {
        const decoded = nip19.decode(naddr).data as nip19.AddressPointer;
        zapRequest.tags.push(["a", `${decoded.kind}:${decoded.pubkey}:${decoded.identifier}`]);
        zapRequest.tags = zapRequest.tags.filter(t => t[0] !== 'e');
      }

      publishEvent(zapRequest, {
        onSuccess: async (event) => {
          try {
            const res = await fetch(`${zapEndpoint}?amount=${zapAmount}&nostr=${encodeURI(JSON.stringify(event))}`);
            const { pr: newInvoice } = await res.json();

            if (webln) {
              await webln.sendPayment(newInvoice);
              toast({
                title: 'Zap successful!',
                description: `You sent ${amount} sats to the author.`,
              });
              onZapSuccess?.();
            } else {
              setInvoice(newInvoice);
            }
          } catch (err) {
            console.error('Zap error:', err);
            toast({
              title: 'Zap failed',
              description: (err as Error).message,
              variant: 'destructive',
            });
          } finally {
            setIsZapping(false);
          }
        },
      });
    } catch (err) {
      toast({
        title: 'Zap failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
      setIsZapping(false);
    }
  };

  return { zaps, ...query, zap, isZapping, invoice, setInvoice };
}
