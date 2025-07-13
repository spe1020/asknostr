import { useState, useEffect, useCallback } from 'react';
import { useNWC } from '@/hooks/useNWC';
import type { WebLNProvider } from 'webln';
import { requestProvider } from 'webln';

export interface WalletStatus {
  hasWebLN: boolean;
  hasNWC: boolean;
  webln: WebLNProvider | null;
  activeNWC: ReturnType<typeof useNWC>['getActiveConnection'] extends () => infer T ? T : null;
  isDetecting: boolean;
  preferredMethod: 'nwc' | 'webln' | 'manual';
}

export function useWallet() {
  const [webln, setWebln] = useState<WebLNProvider | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { getActiveConnection } = useNWC();
  
  const activeNWC = getActiveConnection();

  // Detect WebLN
  const detectWebLN = useCallback(async () => {
    if (webln || isDetecting) return webln;
    
    setIsDetecting(true);
    try {
      const provider = await requestProvider();
      setWebln(provider);
      return provider;
    } catch (error) {
      console.warn('WebLN not available:', error);
      setWebln(null);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, [webln, isDetecting]);

  // Auto-detect on mount
  useEffect(() => {
    detectWebLN();
  }, [detectWebLN]);

  // Test WebLN connection
  const testWebLN = useCallback(async (): Promise<boolean> => {
    if (!webln) return false;
    
    try {
      await webln.enable();
      return true;
    } catch (error) {
      console.error('WebLN test failed:', error);
      return false;
    }
  }, [webln]);

  // Determine preferred payment method
  const preferredMethod: WalletStatus['preferredMethod'] = activeNWC 
    ? 'nwc' 
    : webln 
    ? 'webln' 
    : 'manual';

  const status: WalletStatus = {
    hasWebLN: !!webln,
    hasNWC: !!activeNWC,
    webln,
    activeNWC,
    isDetecting,
    preferredMethod,
  };

  return {
    ...status,
    detectWebLN,
    testWebLN,
  };
}