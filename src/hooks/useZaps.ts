import { useState, useMemo } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/useToast';
import { useNWC } from '@/hooks/useNWCContext';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { NWCConnection } from '@/hooks/useNWC';
import { nip57 } from 'nostr-tools';
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

export function useZaps(
  targets: Event | Event[],
  webln: WebLNProvider | null,
  _nwcConnection: NWCConnection | null,
  onZapSuccess?: () => void
) {
  const { nostr } = useNostr();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const { mutate: publishEvent } = useNostrPublish();

  // Normalize targets to array for consistent handling
  const targetArray = useMemo(() =>
    Array.isArray(targets) ? targets : (targets ? [targets] : []),
    [targets]
  );
  const isBatchMode = Array.isArray(targets);
  const primaryTarget = targetArray[0]; // For single-target operations like zapping

  const author = useAuthor(primaryTarget?.pubkey);
  const { sendPayment, getActiveConnection, connections, activeConnection } = useNWC();
  const [isZapping, setIsZapping] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);

  // Create query key based on mode
  const queryKey = isBatchMode
    ? ['zaps-batch', targetArray.map(t => t.id).sort()]
    : ['zaps-single', primaryTarget.id];

  const { data: zapEvents, ...query } = useQuery<NostrEvent[], Error>({
    queryKey,
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      const filters: NostrFilter[] = [];

      if (isBatchMode) {
        // Batch mode: get zaps for all events at once
        const eventIds = targetArray.map(t => t.id).filter(Boolean);
        const addressableEvents = targetArray.filter(t => t.kind >= 30000 && t.kind < 40000);

        if (eventIds.length > 0) {
          filters.push({
            kinds: [9735],
            '#e': eventIds,
          });
        }

        // Handle addressable events
        if (addressableEvents.length > 0) {
          const addresses = addressableEvents.map(event => {
            const identifier = event.tags.find((t) => t[0] === 'd')?.[1] || '';
            return `${event.kind}:${event.pubkey}:${identifier}`;
          });
          filters.push({
            kinds: [9735],
            '#a': addresses,
          });
        }
      } else {
        // Single mode: get zaps for one event
        const target = primaryTarget;
        if (target.kind >= 30000 && target.kind < 40000) {
          const identifier = target.tags.find((t) => t[0] === 'd')?.[1] || '';
          filters.push({
            kinds: [9735],
            '#a': [`${target.kind}:${target.pubkey}:${identifier}`],
          });
        } else {
          filters.push({
            kinds: [9735],
            '#e': [target.id],
          });
        }
      }

      if (filters.length === 0) return [];
      const events = await nostr.query(filters, { signal });
      return events;
    },
    enabled: targetArray.length > 0 && targetArray.every(t => t.id),
  });

  // Process zap events into organized data
  const zapData = useMemo(() => {
    if (!zapEvents) return {};

    const organized: Record<string, { count: number; totalSats: number; events: NostrEvent[] }> = {};

    zapEvents.forEach(zap => {
      // Find which event this zap is for
      const eventTag = zap.tags.find(([name]) => name === 'e')?.[1];
      const addressTag = zap.tags.find(([name]) => name === 'a')?.[1];

      let targetId: string | undefined;

      if (eventTag) {
        targetId = eventTag;
      } else if (addressTag) {
        // Find the target event that matches this address
        const target = targetArray.find(t => {
          if (t.kind >= 30000 && t.kind < 40000) {
            const identifier = t.tags.find((tag) => tag[0] === 'd')?.[1] || '';
            const address = `${t.kind}:${t.pubkey}:${identifier}`;
            return address === addressTag;
          }
          return false;
        });
        targetId = target?.id;
      }

      if (!targetId) return;

      if (!organized[targetId]) {
        organized[targetId] = { count: 0, totalSats: 0, events: [] };
      }

      organized[targetId].count++;
      organized[targetId].events.push(zap);

      // Extract amount from amount tag
      const amountTag = zap.tags.find(([name]) => name === 'amount')?.[1];
      if (amountTag) {
        const sats = Math.floor(parseInt(amountTag) / 1000); // Convert millisats to sats
        organized[targetId].totalSats += sats;
      }
    });

    return organized;
  }, [zapEvents, targetArray]);

  // For single mode, return the data for the primary target
  const singleTargetData = isBatchMode ? undefined : zapData[primaryTarget.id];
  const zaps = singleTargetData?.events;

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
      if (!author.data || !author.data?.metadata || !author.data?.event ) {
        toast({
          title: 'Author not found',
          description: 'Could not find the author of this item.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      const { lud06, lud16 } = author.data.metadata;
      if (!lud06 && !lud16) {
        toast({
          title: 'Lightning address not found',
          description: 'The author does not have a lightning address configured.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      // Get zap endpoint using the old reliable method
      const zapEndpoint = await nip57.getZapEndpoint(author.data.event);
      if (!zapEndpoint) {
        toast({
          title: 'Zap endpoint not found',
          description: 'Could not find a zap endpoint for the author.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      // Create zap request
      const zapAmount = amount * 1000; // convert to millisats
      const zapRequest = nip57.makeZapRequest({
        profile: primaryTarget.pubkey,
        event: primaryTarget,
        amount: zapAmount,
        relays: [config.relayUrl],
        comment
      });

      // Sign and publish the zap request
      publishEvent(zapRequest, {
        onSuccess: async (event) => {
          try {
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

            // Try NWC first if available and properly connected
            if (currentNWCConnection && currentNWCConnection.connectionString && currentNWCConnection.isConnected) {
              try {
                await sendPayment(currentNWCConnection, newInvoice);

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
            } else if (webln) {  // Try WebLN next
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
            } else { // Default - show QR code and manual Lightning URI
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
    zapData,
    isBatchMode,

    // Helper functions
    getZapData: (eventId: string) => zapData[eventId] || { count: 0, totalSats: 0, events: [] },
  };
}
