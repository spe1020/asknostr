import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/useToast';
import { useNWC } from '@/hooks/useNWCContext';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { NWCConnection } from '@/hooks/useNWC';
import { nip57, nip19 } from 'nostr-tools';
import type { Event } from 'nostr-tools';
import type { WebLNProvider } from 'webln';
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
    const _lud16 = url.searchParams.get('lud16') || undefined;

    if (!walletPubkey || !secret || relayParam.length === 0) {
      return null;
    }

    return {
      connectionString: uri,
      alias: 'Parsed NWC',
      isConnected: false,
    };
  } catch {
    return null;
  }
}

export function useZaps(target: Event, webln: WebLNProvider | null, _nwcConnection: NWCConnection | null, onZapSuccess?: () => void) {
  const { nostr } = useNostr();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const { mutate: publishEvent } = useNostrPublish();
  const author = useAuthor(target?.pubkey);
  const { sendPayment, getActiveConnection, connections, activeConnection } = useNWC();
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
    setInvoice(null); // Clear any previous invoice at the start

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

      const { lud16 } = author.data.metadata;
      if (!lud16) {
        toast({
          title: 'Lightning address not found',
          description: 'The author does not have a lightning address configured.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      // Get zap endpoint using the old reliable method
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

      // Create zap request (unsigned, like the old implementation)
      const zapRequest = nip57.makeZapRequest({
        profile: target.pubkey,
        event: target.id,
        amount: zapAmount,
        relays,
        comment: comment,
      });

      // Handle addressable events (restored from old implementation)
      if (naddr) {
        const decoded = nip19.decode(naddr).data as nip19.AddressPointer;
        zapRequest.tags.push(["a", `${decoded.kind}:${decoded.pubkey}:${decoded.identifier}`]);
        zapRequest.tags = zapRequest.tags.filter(t => t[0] !== 'e');
      }

      // Sign and publish the zap request
      publishEvent(zapRequest, {
        onSuccess: async (event) => {
          try {
            // Use the old fetch method - more reliable than LNURL validation
            const res = await fetch(`${zapEndpoint}?amount=${zapAmount}&nostr=${encodeURI(JSON.stringify(event))}`);
            const responseData = await res.json();

            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${responseData.reason || 'Unknown error'}`);
            }

            const newInvoice = responseData.pr;
            if (!newInvoice || typeof newInvoice !== 'string') {
              throw new Error('Lightning service did not return a valid invoice');
            }

            // Get the current active NWC connection dynamically
            const currentNWCConnection = getActiveConnection();

            console.debug('Zap payment - detailed state check:', {
              // Raw state
              connectionsLength: connections.length,
              activeConnectionString: activeConnection ? activeConnection.substring(0, 50) + '...' : null,

              // Connection details
              connections: connections.map(c => ({
                alias: c.alias,
                isConnected: c.isConnected,
                connectionString: c.connectionString.substring(0, 50) + '...'
              })),

              // getActiveConnection result
              currentNWCConnection: currentNWCConnection ? {
                alias: currentNWCConnection.alias,
                isConnected: currentNWCConnection.isConnected,
                connectionString: currentNWCConnection.connectionString.substring(0, 50) + '...'
              } : null
            });

            // Try NWC first if available and properly connected
            if (currentNWCConnection && currentNWCConnection.connectionString && currentNWCConnection.isConnected) {
              try {
                console.debug('Attempting NWC payment...', {
                  amount,
                  alias: currentNWCConnection.alias,
                  invoiceLength: newInvoice.length
                });

                const response = await sendPayment(currentNWCConnection, newInvoice);

                console.debug('NWC payment successful:', { preimage: response.preimage });

                // Clear states immediately on success
                setIsZapping(false);
                setInvoice(null);

                toast({
                  title: 'Zap successful!',
                  description: `You sent ${amount} sats via NWC to the author.`,
                });

                // Close dialog last to ensure clean state
                onZapSuccess?.();
                return;
              } catch (nwcError) {
                console.error('NWC payment failed, falling back:', nwcError);

                // Show specific NWC error to user for debugging
                const errorMessage = nwcError instanceof Error ? nwcError.message : 'Unknown NWC error';
                toast({
                  title: 'NWC payment failed',
                  description: `${errorMessage}. Falling back to other payment methods...`,
                  variant: 'destructive',
                });
              }
            }

            // Fallback to WebLN or manual payment
            if (webln) {
              await webln.sendPayment(newInvoice);

              // Clear states immediately on success
              setIsZapping(false);
              setInvoice(null);

              toast({
                title: 'Zap successful!',
                description: `You sent ${amount} sats to the author.`,
              });

              // Close dialog last to ensure clean state
              onZapSuccess?.();
            } else {
              setInvoice(newInvoice);
              setIsZapping(false);
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
        onError: (err) => {
          console.error('Failed to publish zap request:', err);
          toast({
            title: 'Zap failed',
            description: 'Failed to create zap request',
            variant: 'destructive',
          });
          setIsZapping(false);
        },
      });
    } catch (err) {
      console.error('Zap error:', err);
      toast({
        title: 'Zap failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
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
