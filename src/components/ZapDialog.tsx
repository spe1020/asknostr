import { useState, useEffect, useRef } from 'react';
import { Zap, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import { useZaps } from '@/hooks/useZaps';
import type { WebLNProvider } from 'webln';
import QRCode from 'qrcode';
import type { Event } from 'nostr-tools';

interface ZapDialogProps {
  target: Event;
  children?: React.ReactNode;
  className?: string;
}

const presetAmounts = [1, 50, 100, 250, 1000];

export function ZapDialog({ target, children, className }: ZapDialogProps) {
  const [open, setOpen] = useState(false);
  const [webln, _setWebln] = useState<WebLNProvider | null>(null);
  const { user } = useCurrentUser();
  const { data: author } = useAuthor(target.pubkey);
  const { toast } = useToast();
  const { zap, isZapping, invoice, setInvoice } = useZaps(target, webln, () => setOpen(false));
  const [amount, setAmount] = useState<number | string>(100);
  const [comment, setComment] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (target) {
      setComment('Zapped with MKStack!');
    }
  }, [target]);

  useEffect(() => {
    if (invoice && qrCodeRef.current) {
      QRCode.toCanvas(qrCodeRef.current, invoice, { width: 256 });
    }
  }, [invoice]);

  const handleCopy = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice);
      toast({
        title: 'Copied to clipboard!',
      });
    }
  };

  useEffect(() => {
    if (open) {
      setAmount(100);
      setInvoice(null);
    }
  }, [open, setInvoice]);

  const handleZap = () => {
    const finalAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
    zap(finalAmount, comment);
  };

  if (!user || user.pubkey === target.pubkey || !author?.metadata?.lud16) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={className}>
          <Zap className={`h-4 w-4 ${children ? 'mr-2' : ''}`} />
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" data-testid="zap-modal">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Manual Zap' : 'Send a Zap'}</DialogTitle>
          <DialogDescription asChild>
            {invoice ? (
              <div>Scan the QR code with a lightning-enabled wallet or copy the invoice below.</div>
            ) : (
              <>
                <div>Zaps are small Bitcoin payments that support the creator of this item.</div>
                <div className="mt-2">If you enjoyed this, consider sending a zap!</div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {invoice ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <canvas ref={qrCodeRef} />
            <div className="flex w-full items-center gap-2">
              <Input value={invoice} readOnly className="flex-1" />
              <Button onClick={handleCopy} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <ToggleGroup
                type="single"
                value={String(amount)}
                onValueChange={(value) => {
                  if (value) {
                    setAmount(parseInt(value, 10));
                  }
                }}
                className="grid grid-cols-5 gap-2"
              >
                {presetAmounts.map((presetAmount) => (
                  <ToggleGroupItem
                    key={presetAmount}
                    value={String(presetAmount)}
                    className="flex flex-col h-auto"
                  >
                    {presetAmount}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-muted" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="h-px flex-1 bg-muted" />
              </div>
              <Input
                ref={inputRef}
                id="custom-amount"
                type="number"
                placeholder="Custom amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Textarea
                id="custom-comment"
                placeholder="Custom comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleZap} className="w-full" disabled={isZapping}>
                {isZapping ? (
                  'Creating invoice...'
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Zap {amount} sats
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
