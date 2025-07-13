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

interface NWCInfo {
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

  // Use connections directly - no filtering needed

  // Parse and validate NWC URI
  const parseNWCUri = (uri: string): { connectionString: string } | null => {
    try {
      console.debug('Parsing NWC URI:', { uri: uri.substring(0, 50) + '...' });

      if (!uri.startsWith('nostr+walletconnect://') && !uri.startsWith('nostrwalletconnect://')) {
        console.error('Invalid NWC URI protocol:', { protocol: uri.split('://')[0] });
        return null;
      }

      // Basic validation - let the SDK handle the detailed parsing
      console.debug('NWC URI parsing successful');
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
      console.debug('Testing NWC connection:', { uri: uri.substring(0, 50) + '...' });

      // Test the connection by creating an LN client with timeout
      const testPromise = new Promise((resolve, reject) => {
        try {
          const client = new LN(parsed.connectionString);
          resolve(client);
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timeout')), 10000);
      });

      const _client = await Promise.race([testPromise, timeoutPromise]) as LN;

      const connection: NWCConnection = {
        connectionString: parsed.connectionString,
        alias: alias || 'NWC Wallet',
        isConnected: true,
        // Don't store the client, create fresh ones for each payment
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

      console.debug('NWC connection added:', {
        alias: connection.alias,
        totalConnections: newConnections.length,
        connectionString: parsed.connectionString.substring(0, 50) + '...',
        isConnected: connection.isConnected
      });

      // Set as active if it's the first connection or no active connection is set
      if (connections.length === 0 || !activeConnection) {
        console.debug('Setting as active connection:', {
          alias: connection.alias,
          connectionString: parsed.connectionString.substring(0, 50) + '...',
          previousActiveConnection: activeConnection
        });
        setActiveConnection(parsed.connectionString);
        console.debug('Active connection set to:', parsed.connectionString.substring(0, 50) + '...');
      }

      console.debug('NWC connection successful');

      // Force a small delay to ensure state updates are processed
      setTimeout(() => {
        console.debug('Post-connection state check:', {
          connectionsLength: connections.length + 1, // +1 because we just added one
          newConnectionAlias: connection.alias
        });
      }, 100);

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

    console.debug('NWC connection removed:', {
      remainingConnections: filtered.length
    });

    if (activeConnection === connectionString) {
      const newActive = filtered.length > 0 ? filtered[0].connectionString : null;
      setActiveConnection(newActive);
      console.debug('Active connection changed:', { newActive });
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
    console.debug('getActiveConnection called:', {
      activeConnection,
      connectionsLength: connections.length,
      connections: connections.map(c => ({ alias: c.alias, connectionString: c.connectionString.substring(0, 50) + '...' }))
    });

    // If no active connection is set but we have connections, set the first one as active
    if (!activeConnection && connections.length > 0) {
      console.debug('Setting first connection as active:', connections[0].alias);
      setActiveConnection(connections[0].connectionString);
      return connections[0];
    }

    if (!activeConnection) {
      console.debug('No active connection and no connections');
      return null;
    }

    const found = connections.find(c => c.connectionString === activeConnection);
    console.debug('Found active connection:', found ? found.alias : 'null');
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
      console.debug('Creating fresh NWC client for payment...');
      client = new LN(connection.connectionString);
    } catch (error) {
      console.error('Failed to create NWC client:', error);
      throw new Error(`Failed to create NWC client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      console.debug('Sending payment via NWC SDK:', {
        invoice: invoice.substring(0, 50) + '...',
        connectionAlias: connection.alias
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Payment timeout after 30 seconds')), 30000);
      });

      const paymentPromise = client.pay(invoice);
      const response = await Promise.race([paymentPromise, timeoutPromise]) as { preimage: string };

      console.debug('Payment successful:', { preimage: response.preimage });
      return response;
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
      console.debug('Testing NWC connection...', { alias: connection.alias });

      // Create a fresh client for testing
      const testPromise = new Promise((resolve, reject) => {
        try {
          const client = new LN(connection.connectionString);
          resolve(client);
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timeout')), 5000);
      });

      await Promise.race([testPromise, timeoutPromise]);

      console.debug('NWC connection test successful');
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