import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/useToast';
import { useNWC } from '@/hooks/useNWC';
import type { NWCConnection } from '@/hooks/useNWC';
import { nip57, nip19 } from 'nostr-tools';
import type { Event } from 'nostr-tools';
import type { WebLNProvider } from 'webln';
import { LNURL } from '@nostrify/nostrify/ln';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

// NWC utility functions
function parseNWCUri(uri: string): NWCConnection | null {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'nostr+walletconnect:') {
      return null;
    }

    const walletPubkey = url.pathname.replace('//', '');
    const secret = url.searchParams.get('secret');
    const relayParam = url.searchParams.getAll('relay');
    const lud16 = url.searchParams.get('lud16') || undefined;

    if (!walletPubkey || !secret || relayParam.length === 0) {
      return null;
    }

    return {
      walletPubkey,
      secret,
      relayUrls: relayParam,
      lud16,
    };
  } catch {
    return null;
  }
}

export function useZaps(target: Event, webln: WebLNProvider | null, nwcConnection: NWCConnection | null, onZapSuccess?: () => void) {
  const { nostr } = useNostr();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const author = useAuthor(target?.pubkey);
  const { sendNWCRequest } = useNWC();
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
      if (!author.data || !author.data?.metadata) {
        toast({
          title: 'Author not found',
          description: 'Could not find the author of this item.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      const { lud06, lud16 } = author.data.metadata;
      if (!lud16 && !lud06) {
        toast({
          title: 'Lightning address not found',
          description: 'The author does not have a lightning address (lud16 or lud06) configured.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      const lnurl = lud06 ? LNURL.fromString(lud06) : LNURL.fromLightningAddress(lud16!);
      const zapAmount = amount * 1000; // convert to millisats
      const zapRequest = await user.signer.signEvent(nip57.makeZapRequest({
        profile: target.pubkey,
        event: target,
        amount: zapAmount,
        relays: [config.relayUrl],
        comment: comment,
      }));

      const { pr: newInvoice } = await lnurl.getInvoice({
        amount: zapAmount,
        nostr: zapRequest,
      });

      // Try NWC first if available
      if (nwcConnection) {
        try {
          const response = await sendNWCRequest(nwcConnection, {
            method: 'pay_invoice',
            params: {
              invoice: newInvoice,
              amount: zapAmount,
            },
          });

          if (response.error) {
            throw new Error(`NWC Error: ${response.error.message}`);
          }

          toast({
            title: 'Zap successful!',
            description: `You sent ${amount} sats via NWC to the author.`,
          });
          onZapSuccess?.();
          return;
        } catch (nwcError) {
          console.error('NWC payment failed, falling back:', nwcError);
          toast({
            title: 'NWC payment failed',
            description: 'Falling back to manual payment...',
            variant: 'destructive',
          });
        }
      }

      // Fallback to WebLN or manual payment
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
  };

  return {
    zaps,
    ...query,
    zap,
    isZapping,
    invoice,
    setInvoice,
    parseNWCUri,
  };
}
