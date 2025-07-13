import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { nip04 } from 'nostr-tools';
import { useNostr } from '@nostrify/react';

export interface NWCConnection {
  walletPubkey: string;
  secret: string;
  relayUrls: string[];
  lud16?: string;
  alias?: string;
}

interface NWCInfo {
  alias?: string;
  color?: string;
  pubkey?: string;
  network?: string;
  methods?: string[];
  notifications?: string[];
}

export function useNWC() {
  const { nostr } = useNostr();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const [connections, setConnections] = useLocalStorage<NWCConnection[]>('nwc-connections', []);
  const [activeConnection, setActiveConnection] = useLocalStorage<string | null>('nwc-active-connection', null);
  const [connectionInfo, setConnectionInfo] = useState<Record<string, NWCInfo>>({});

  // Parse NWC URI
  const parseNWCUri = (uri: string): NWCConnection | null => {
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
  };

  // Add new connection
  const addConnection = async (uri: string, alias?: string): Promise<boolean> => {
    const connection = parseNWCUri(uri);
    if (!connection) {
      toast({
        title: 'Invalid NWC URI',
        description: 'Please check the connection string and try again.',
        variant: 'destructive',
      });
      return false;
    }

    // Check if connection already exists
    const existingConnection = connections.find(c => c.walletPubkey === connection.walletPubkey);
    if (existingConnection) {
      toast({
        title: 'Connection already exists',
        description: 'This wallet is already connected.',
        variant: 'destructive',
      });
      return false;
    }

    if (alias) {
      connection.alias = alias;
    }

    try {
      // Test connection by fetching info
      await fetchWalletInfo(connection);

      setConnections(prev => [...prev, connection]);

      // Set as active if it's the first connection
      if (connections.length === 0) {
        setActiveConnection(connection.walletPubkey);
      }

      toast({
        title: 'Wallet connected',
        description: `Successfully connected to ${alias || 'wallet'}.`,
      });

      return true;
    } catch {
      toast({
        title: 'Connection failed',
        description: 'Could not connect to the wallet. Please check your connection.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Remove connection
  const removeConnection = (walletPubkey: string) => {
    setConnections(prev => prev.filter(c => c.walletPubkey !== walletPubkey));

    if (activeConnection === walletPubkey) {
      const remaining = connections.filter(c => c.walletPubkey !== walletPubkey);
      setActiveConnection(remaining.length > 0 ? remaining[0].walletPubkey : null);
    }

    setConnectionInfo(prev => {
      const newInfo = { ...prev };
      delete newInfo[walletPubkey];
      return newInfo;
    });

    toast({
      title: 'Wallet disconnected',
      description: 'The wallet connection has been removed.',
    });
  };

  // Get active connection
  const getActiveConnection = (): NWCConnection | null => {
    if (!activeConnection) return null;
    return connections.find(c => c.walletPubkey === activeConnection) || null;
  };

  // Send NWC request
  const sendNWCRequest = useCallback(async (
    connection: NWCConnection,
    request: { method: string; params: Record<string, unknown> }
  ): Promise<{ result_type: string; error?: { code: string; message: string }; result?: unknown }> => {
    if (!user?.signer) {
      throw new Error('User not logged in or signer not available');
    }

    // Create request event
    const requestEvent = {
      kind: 23194,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', connection.walletPubkey]],
      content: await nip04.encrypt(connection.secret, connection.walletPubkey, JSON.stringify(request)),
    };

    // Sign and publish request
    const signedRequest = await user.signer.signEvent(requestEvent);
    if (!signedRequest) {
      throw new Error('Failed to sign NWC request');
    }

    // Publish to NWC relays
    try {
      await nostr.event(signedRequest, {
        signal: AbortSignal.timeout(10000),
        relays: connection.relayUrls
      });
    } catch (error) {
      console.warn('Failed to publish NWC request:', error);
      throw new Error('Failed to publish NWC request');
    }

    // Listen for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('NWC request timeout'));
      }, 30000); // 30 second timeout

      // Query for response events
      const checkForResponse = async () => {
        try {
          const responseEvents = await nostr.query([
            {
              kinds: [23195],
              authors: [connection.walletPubkey],
              '#p': [user.pubkey],
              '#e': [signedRequest.id],
              since: Math.floor(Date.now() / 1000) - 60,
            },
          ], { signal: AbortSignal.timeout(30000) });

          for (const event of responseEvents) {
            try {
              const decrypted = await nip04.decrypt(
                connection.secret,
                connection.walletPubkey,
                event.content
              );
              const response = JSON.parse(decrypted);
              clearTimeout(timeout);
              resolve(response);
              return;
            } catch (error) {
              console.error('Failed to decrypt NWC response:', error);
            }
          }

          // If no response found, wait and try again
          setTimeout(checkForResponse, 2000);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      // Start checking for responses
      setTimeout(checkForResponse, 1000); // Wait 1 second before first check
    });
  }, [nostr, user]);

  // Fetch wallet info
  const fetchWalletInfo = useCallback(async (connection: NWCConnection): Promise<NWCInfo> => {
    // First, try to get the info event (kind 13194)
    try {
      const infoEvents = await nostr.query([
        {
          kinds: [13194],
          authors: [connection.walletPubkey],
          limit: 1,
        }
      ], { signal: AbortSignal.timeout(5000) });

      if (infoEvents.length > 0) {
        const infoEvent = infoEvents[0];
        const capabilities = infoEvent.content.split(' ');
        const notificationsTag = infoEvent.tags.find(tag => tag[0] === 'notifications');
        const notifications = notificationsTag ? notificationsTag[1].split(' ') : [];

        const info: NWCInfo = {
          methods: capabilities,
          notifications,
        };

        setConnectionInfo(prev => ({
          ...prev,
          [connection.walletPubkey]: info,
        }));

        return info;
      }
    } catch (error) {
      console.warn('Failed to fetch NWC info event:', error);
    }

    // Fallback: try to send a get_info request
    try {
      const response = await sendNWCRequest(connection, { method: 'get_info', params: {} });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const info = response.result as NWCInfo;
      setConnectionInfo(prev => ({
        ...prev,
        [connection.walletPubkey]: info,
      }));

      return info;
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
      throw error;
    }
  }, [nostr, sendNWCRequest]);

  // Fetch info for all connections on mount
  useEffect(() => {
    connections.forEach(connection => {
      if (!connectionInfo[connection.walletPubkey]) {
        fetchWalletInfo(connection).catch(console.error);
      }
    });
  }, [connections, connectionInfo, fetchWalletInfo]);

  return {
    connections,
    activeConnection,
    connectionInfo,
    addConnection,
    removeConnection,
    setActiveConnection,
    getActiveConnection,
    fetchWalletInfo,
    sendNWCRequest,
    parseNWCUri,
  };
}