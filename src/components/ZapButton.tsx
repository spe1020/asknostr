import { ZapDialog } from '@/components/ZapDialog';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Zap } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ZapButtonProps {
  target: NostrEvent;
  className?: string;
  showCount?: boolean;
  zapData?: { count: number; totalSats: number; isLoading?: boolean };
}

export function ZapButton({
  target,
  className = "text-xs ml-1",
  showCount = true,
  zapData: externalZapData
}: ZapButtonProps) {
  const { user } = useCurrentUser();
  const { data: author } = useAuthor(target?.pubkey || '');
  const { webln, activeNWC } = useWallet();

  // Only fetch data if not provided externally
  const { totalSats: fetchedTotalSats } = useZaps(
    externalZapData ? [] : target ?? [], // Empty array prevents fetching if external data provided
    webln,
    activeNWC
  );

  // Use external data if provided, otherwise use fetched data
  const totalSats = externalZapData?.totalSats ?? fetchedTotalSats;

  // Check if user can zap (logged in, not the author, and author has lightning address)
  const canZap = user && target && user.pubkey !== target.pubkey && (author?.metadata?.lud16 || author?.metadata?.lud06);

  const buttonContent = (
    <div className={`flex items-center gap-1 ${className} ${!canZap ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'}`}>
      <Zap className="h-4 w-4" />
      {showCount && totalSats > 0 && (
        <span className="text-xs font-medium">
          {totalSats.toLocaleString()}
        </span>
      )}
    </div>
  );

  if (!canZap) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-not-allowed">
              {buttonContent}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {!user ? 'Login to zap' : 
             user.pubkey === target.pubkey ? 'You cannot zap your own content' : 
             'Author has no lightning address'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <ZapDialog target={target}>
      {buttonContent}
    </ZapDialog>
  );
}