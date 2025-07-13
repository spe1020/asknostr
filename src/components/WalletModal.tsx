import { useState } from 'react';
import { Wallet, Plus, Trash2, Zap, Globe, Settings, CheckCircle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNWC } from '@/hooks/useNWC';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/useToast';

interface WalletModalProps {
  children?: React.ReactNode;
  className?: string;
}

export function WalletModal({ children, className }: WalletModalProps) {
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [connectionUri, setConnectionUri] = useState('');
  const [alias, setAlias] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    connections,
    activeConnection,
    connectionInfo,
    addConnection,
    removeConnection,
    setActiveConnection
  } = useNWC();

  const { hasWebLN, hasNWC, isDetecting } = useWallet();
  const { toast } = useToast();

  const handleAddConnection = async () => {
    if (!connectionUri.trim()) {
      toast({
        title: 'Connection URI required',
        description: 'Please enter a valid NWC connection URI.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    try {
      const success = await addConnection(connectionUri.trim(), alias.trim() || undefined);
      if (success) {
        setConnectionUri('');
        setAlias('');
        setAddDialogOpen(false);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRemoveConnection = (walletPubkey: string) => {
    removeConnection(walletPubkey);
  };

  const handleSetActive = (walletPubkey: string) => {
    setActiveConnection(walletPubkey);
    toast({
      title: 'Active wallet changed',
      description: 'The selected wallet is now active for zaps.',
    });
  };



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className={className}>
            <Wallet className="h-4 w-4 mr-2" />
            Wallet Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Lightning Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your lightning wallet to send zaps instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="space-y-3">
            <h3 className="font-medium">Current Status</h3>

            <div className="grid gap-3">
              {/* WebLN */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">WebLN</p>
                    <p className="text-xs text-muted-foreground">Browser extension</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasWebLN && <CheckCircle className="h-4 w-4 text-green-600" />}
                  <Badge variant={hasWebLN ? "default" : "secondary"} className="text-xs">
                    {isDetecting ? "..." : hasWebLN ? "Ready" : "Not Found"}
                  </Badge>
                </div>
              </div>

              {/* NWC */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Nostr Wallet Connect</p>
                    <p className="text-xs text-muted-foreground">
                      {connections.length > 0
                        ? `${connections.length} wallet${connections.length !== 1 ? 's' : ''} connected`
                        : "Remote wallet connection"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasNWC && <CheckCircle className="h-4 w-4 text-green-600" />}
                  <Badge variant={hasNWC ? "default" : "secondary"} className="text-xs">
                    {hasNWC ? "Ready" : "None"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* NWC Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Nostr Wallet Connect</h3>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect NWC Wallet</DialogTitle>
                    <DialogDescription>
                      Enter your connection string from a compatible wallet.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="alias">Wallet Name (optional)</Label>
                      <Input
                        id="alias"
                        placeholder="My Lightning Wallet"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="connection-uri">Connection URI</Label>
                      <Textarea
                        id="connection-uri"
                        placeholder="nostr+walletconnect://..."
                        value={connectionUri}
                        onChange={(e) => setConnectionUri(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleAddConnection}
                      disabled={isConnecting || !connectionUri.trim()}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {/* Connected Wallets List */}
            {connections.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No wallets connected</p>
              </div>
            ) : (
              <div className="space-y-2">
                {connections.map((connection) => {
                  const info = connectionInfo[connection.walletPubkey];
                  const isActive = activeConnection === connection.walletPubkey;

                  return (
                    <div key={connection.walletPubkey} className={`flex items-center justify-between p-3 border rounded-lg ${isActive ? 'ring-2 ring-primary' : ''}`}>
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {connection.alias || info?.alias || 'Lightning Wallet'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {connection.walletPubkey.slice(0, 16)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {!isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetActive(connection.walletPubkey)}
                          >
                            <Zap className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveConnection(connection.walletPubkey)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Help */}
          {!hasWebLN && connections.length === 0 && (
            <>
              <Separator />
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Install a WebLN extension (like Alby) or connect an NWC wallet for instant zaps.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}