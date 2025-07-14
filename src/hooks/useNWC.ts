import { useState, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/useToast';
import { LN } from '@getalby/sdk';

export interface NWCConnection {
  connectionString: string;
  alias?: string;
  isConnected: boolean;
  client?: LN;
}

export interface NWCInfo {
  alias?: string;
  color?: string;
  pubkey?: string;
  network?: string;
  methods?: string[];
  notifications?: string[];
}

export function useNWCInternal() {
  const { toast } = useToast();
  const [connections, setConnections] = useLocalStorage<NWCConnection[]>('nwc-connections', []);
  const [activeConnection, setActiveConnection] = useLocalStorage<string | null>('nwc-active-connection', null);
  const [connectionInfo, setConnectionInfo] = useState<Record<string, NWCInfo>>({});

  // Parse and validate NWC URI
  const parseNWCUri = (uri: string): { connectionString: string } | null => {
    try {
      if (!uri.startsWith('nostr+walletconnect://') && !uri.startsWith('nostrwalletconnect://')) {
        console.error('Invalid NWC URI protocol:', { protocol: uri.split('://')[0] });
        return null;
      }

      // Basic validation - let the SDK handle the detailed parsing
      return { connectionString: uri };
    } catch (error) {
      console.error('Failed to parse NWC URI:', error);
      return null;
    }
  };

  // Add new connection
  const addConnection = async (uri: string, alias?: string): Promise<boolean> => {
    const parsed = parseNWCUri(uri);
    if (!parsed) {
      toast({
        title: 'Invalid NWC URI',
        description: 'Please check the connection string and try again.',
        variant: 'destructive',
      });
      return false;
    }

    // Check if connection already exists
    const existingConnection = connections.find(c => c.connectionString === parsed.connectionString);
    if (existingConnection) {
      toast({
        title: 'Connection already exists',
        description: 'This wallet is already connected.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Test the connection by creating an LN client with timeout
      let timeoutId: NodeJS.Timeout | undefined;
      const testPromise = new Promise((resolve, reject) => {
        try {
          const client = new LN(parsed.connectionString);
          resolve(client);
        } catch (error) {
          reject(error);
        }
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Connection test timeout')), 10000);
      });

      try {
        await Promise.race([testPromise, timeoutPromise]) as LN;
        if (timeoutId) clearTimeout(timeoutId);
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }

      const connection: NWCConnection = {
        connectionString: parsed.connectionString,
        alias: alias || 'NWC Wallet',
        isConnected: true,
      };

      // Store basic connection info
      setConnectionInfo(prev => ({
        ...prev,
        [parsed.connectionString]: {
          alias: connection.alias,
          methods: ['pay_invoice'], // Assume basic payment capability
        },
      }));

      const newConnections = [...connections, connection];
      setConnections(newConnections);

      // Set as active if it's the first connection or no active connection is set
      if (connections.length === 0 || !activeConnection)
        setActiveConnection(parsed.connectionString);

      toast({
        title: 'Wallet connected',
        description: `Successfully connected to ${connection.alias}.`,
      });

      return true;
    } catch (error) {
      console.error('NWC connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      toast({
        title: 'Connection failed',
        description: `Could not connect to the wallet: ${errorMessage}`,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Remove connection
  const removeConnection = (connectionString: string) => {
    const filtered = connections.filter(c => c.connectionString !== connectionString);
    setConnections(filtered);

    if (activeConnection === connectionString) {
      const newActive = filtered.length > 0 ? filtered[0].connectionString : null;
      setActiveConnection(newActive);
    }

    setConnectionInfo(prev => {
      const newInfo = { ...prev };
      delete newInfo[connectionString];
      return newInfo;
    });

    toast({
      title: 'Wallet disconnected',
      description: 'The wallet connection has been removed.',
    });
  };

  // Get active connection
  const getActiveConnection = useCallback((): NWCConnection | null => {
    // If no active connection is set but we have connections, set the first one as active
    if (!activeConnection && connections.length > 0) {
      setActiveConnection(connections[0].connectionString);
      return connections[0];
    }

    if (!activeConnection) return null;

    const found = connections.find(c => c.connectionString === activeConnection);
    return found || null;
  }, [activeConnection, connections, setActiveConnection]);

  // Send payment using the SDK
  const sendPayment = useCallback(async (
    connection: NWCConnection,
    invoice: string
  ): Promise<{ preimage: string }> => {
    if (!connection.connectionString) {
      throw new Error('Invalid connection: missing connection string');
    }

    // Always create a fresh client for each payment to avoid stale connections
    let client: LN;
    try {
      client = new LN(connection.connectionString);
    } catch (error) {
      console.error('Failed to create NWC client:', error);
      throw new Error(`Failed to create NWC client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Add timeout to prevent hanging with proper cleanup
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Payment timeout after 15 seconds')), 15000);
      });

      const paymentPromise = client.pay(invoice);

      try {
        const response = await Promise.race([paymentPromise, timeoutPromise]) as { preimage: string };
        if (timeoutId) clearTimeout(timeoutId);
        return response;
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('NWC payment failed:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Payment timed out. Please try again.');
        } else if (error.message.includes('insufficient')) {
          throw new Error('Insufficient balance in connected wallet.');
        } else if (error.message.includes('invalid')) {
          throw new Error('Invalid invoice or connection. Please check your wallet.');
        } else {
          throw new Error(`Payment failed: ${error.message}`);
        }
      }

      throw new Error('Payment failed with unknown error');
    }
  }, []);

  // Get wallet info (simplified since SDK doesn't expose getInfo)
  const getWalletInfo = useCallback(async (connection: NWCConnection): Promise<NWCInfo> => {
    // Return stored info or basic fallback
    const info = connectionInfo[connection.connectionString] || {
      alias: connection.alias,
      methods: ['pay_invoice'],
    };
    return info;
  }, [connectionInfo]);

  // Test NWC connection
  const testNWCConnection = useCallback(async (connection: NWCConnection): Promise<boolean> => {
    if (!connection.connectionString) {
      console.error('NWC connection test failed: missing connection string');
      return false;
    }

    try {
      // Create a fresh client for testing
      let timeoutId: NodeJS.Timeout | undefined;
      const testPromise = new Promise((resolve, reject) => {
        try {
          const client = new LN(connection.connectionString);
          resolve(client);
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Connection test timeout')), 5000);
      });

      try {
        await Promise.race([testPromise, timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('NWC connection test failed:', error);
      return false;
    }
  }, []);

  return {
    connections,
    activeConnection,
    connectionInfo,
    addConnection,
    removeConnection,
    setActiveConnection,
    getActiveConnection,
    sendPayment,
    getWalletInfo,
    parseNWCUri,
    testNWCConnection,
  };
}