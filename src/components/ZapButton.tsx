import { ZapDialog } from '@/components/ZapDialog';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Zap } from 'lucide-react';
import type { Event } from 'nostr-tools';

interface ZapButtonProps {
  target: Event;
  className?: string;
  showCount?: boolean;
  // New: option to pass pre-fetched zap data (for batch mode)
  zapData?: { count: number; totalSats: number; isLoading?: boolean };
}

export function ZapButton({
  target,
  className = "text-xs ml-1",
  showCount = true,
  zapData: externalZapData
}: ZapButtonProps) {
  const { user } = useCurrentUser();
  const { data: author } = useAuthor(target.pubkey);
  const { webln, activeNWC } = useWallet();

  // Only fetch data if not provided externally
  const { getZapData, isLoading } = useZaps(
    externalZapData ? [] : target, // Empty array prevents fetching if external data provided
    webln,
    activeNWC
  );

  // Don't show zap button if user is not logged in, is the author, or author has no lightning address
  if (!user || user.pubkey === target.pubkey || (!author?.metadata?.lud16 && !author?.metadata?.lud06)) {
    return null;
  }

  // Use external data if provided, otherwise use fetched data
  const zapInfo = externalZapData || getZapData(target.id);
  const { count: zapCount, totalSats } = zapInfo;
  const dataLoading = 'isLoading' in zapInfo ? zapInfo.isLoading : false;
  const showLoading = externalZapData?.isLoading || dataLoading || isLoading;

  return (
    <ZapDialog target={target}>
      <div className={className}>
        <Zap className="h-4 w-4 mr-1" />
        <span className="text-xs">
          {showLoading ? (
            '...'
          ) : showCount && zapCount > 0 ? (
            totalSats > 0 ? `${totalSats.toLocaleString()}` : zapCount
          ) : (
            'Zap'
          )}
        </span>
      </div>
    </ZapDialog>
  );
}