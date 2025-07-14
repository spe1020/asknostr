import { useState, useEffect, useRef } from 'react';
import { Zap, Copy, Check, ExternalLink, Sparkle, Sparkles, Star, Rocket } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import type { Event } from 'nostr-tools';
import QRCode from 'qrcode';

interface ZapDialogProps {
  target: Event;
  children?: React.ReactNode;
  className?: string;
}

const presetAmounts = [
  { amount: 1, icon: Sparkle },
  { amount: 50, icon: Sparkles },
  { amount: 100, icon: Zap },
  { amount: 250, icon: Star },
  { amount: 1000, icon: Rocket },
];

export function ZapDialog({ target, children, className }: ZapDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUser();
  const { data: author } = useAuthor(target.pubkey);
  const { toast } = useToast();
  const { webln, activeNWC, hasWebLN, detectWebLN } = useWallet();
  const { zap, isZapping, invoice, setInvoice } = useZaps(target, webln, activeNWC, () => setOpen(false));
  const [amount, setAmount] = useState<number | string>(100);
  const [comment, setComment] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (target) {
      setComment('Zapped with MKStack!');
    }
  }, [target]);

  // Detect WebLN when dialog opens
  useEffect(() => {
    if (open && !hasWebLN) {
      detectWebLN();
    }
  }, [open, hasWebLN, detectWebLN]);

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      if (!invoice) return;

      try {
        const url = await QRCode.toDataURL(invoice.toUpperCase(), {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    generateQR();
  }, [invoice]);

  const handleCopy = async () => {
    if (invoice) {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      toast({
        title: 'Invoice copied',
        description: 'Lightning invoice copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openInWallet = () => {
    if (invoice) {
      const lightningUrl = `lightning:${invoice}`;
      window.open(lightningUrl, '_blank');
    }
  };

  useEffect(() => {
    if (open) {
      setAmount(100);
      setInvoice(null);
      setCopied(false);
      setQrCodeUrl('');
    }
  }, [open, setInvoice]);

  const handleZap = () => {
    const finalAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
    zap(finalAmount, comment);
  };

  if (!user || user.pubkey === target.pubkey || !author?.metadata?.lud06 && !author?.metadata?.lud16) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={`cursor-pointer ${className || ''}`}>
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" data-testid="zap-modal">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Lightning Payment' : 'Send a Zap'}</DialogTitle>
          <DialogDescription>
            {invoice ? (
              'Scan the QR code or copy the invoice to pay with any Lightning wallet'
            ) : (
              <>
                Zaps are small Bitcoin payments that support the creator of this item.
                {' '}If you enjoyed this, consider sending a zap!
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {invoice ? (
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] p-1">
            {/* Payment amount display */}
            <div className="text-center">
              <div className="text-2xl font-bold">{amount} sats</div>
              <div className="text-sm text-muted-foreground">Lightning Network Payment</div>
            </div>

            <Separator />

            {/* QR Code */}
            <div className="flex justify-center">
              <Card className="p-4">
                <CardContent className="p-0">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Lightning Invoice QR Code"
                      className="w-64 h-64"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-muted animate-pulse rounded" />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Invoice input */}
            <div className="space-y-2">
              <Label htmlFor="invoice">Lightning Invoice</Label>
              <div className="flex gap-2">
                <Input
                  id="invoice"
                  value={invoice}
                  readOnly
                  className="font-mono text-xs"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Payment buttons */}
            <div className="space-y-3">
              {hasWebLN && (
                <Button
                  onClick={() => {
                    const finalAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
                    zap(finalAmount, comment);
                  }}
                  disabled={isZapping}
                  className="w-full"
                  size="lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isZapping ? "Processing..." : "Pay with WebLN"}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={openInWallet}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Lightning Wallet
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                Scan the QR code or copy the invoice to pay with any Lightning wallet
              </div>
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
                {presetAmounts.map(({ amount: presetAmount, icon: Icon }) => (
                  <ToggleGroupItem
                    key={presetAmount}
                    value={String(presetAmount)}
                    className="flex flex-col h-auto"
                  >
                    <Icon className="h-5 w-5 mb-1.5" />
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
