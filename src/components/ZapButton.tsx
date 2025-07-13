import { ZapDialog } from '@/components/ZapDialog';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import type { Event } from 'nostr-tools';

interface ZapButtonProps {
  target: Event;
  className?: string;
  showCount?: boolean;
}

export function ZapButton({ target, className = "text-xs ml-1", showCount = true }: ZapButtonProps) {
  const { user } = useCurrentUser();
  const { data: author } = useAuthor(target.pubkey);
  const { webln, activeNWC } = useWallet();
  const { zaps } = useZaps(target, webln, activeNWC);

  // Don't show zap button if user is not logged in, is the author, or author has no lightning address
  if (!user || user.pubkey === target.pubkey || (!author?.metadata?.lud16 && !author?.metadata?.lud06)) {
    return null;
  }

  const zapCount = zaps?.length || 0;
  const totalSats = zaps?.reduce((total, zap) => {
    // Extract amount from amount tag
    const amountTag = zap.tags.find(([name]) => name === 'amount')?.[1];

    if (amountTag) {
      return total + Math.floor(parseInt(amountTag) / 1000); // Convert millisats to sats
    }

    // If no amount tag, don't count towards total
    return total;
  }, 0) || 0;

  return (
    <ZapDialog target={target}>
      {showCount && zapCount > 0 && (
        <span className={className}>
          {totalSats > 0 ? `${totalSats.toLocaleString()}` : zapCount}
        </span>
      )}
    </ZapDialog>
  );
}