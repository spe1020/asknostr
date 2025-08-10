import { Key, Copy, Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrLogin } from '@nostrify/react/login';
import { nip19 } from 'nostr-tools';

export function KeysDisplay() {
  const { user } = useCurrentUser();
  const { logins } = useNostrLogin();
  const { toast } = useToast();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!user || !logins.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No user logged in
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentLogin = logins[0];
  const npub = nip19.npubEncode(user.pubkey);
  
  // Get nsec if available (only for nsec login type)
  const nsec = currentLogin.type === 'nsec' ? (currentLogin as { data: { nsec: string } }).data.nsec : null;

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: `${fieldName} copied!`,
        description: "Copied to clipboard",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const getLoginTypeDisplay = () => {
    switch (currentLogin.type) {
      case 'nsec':
        return { label: 'Secret Key', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
      case 'extension':
        return { label: 'Browser Extension', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
      case 'bunker':
        return { label: 'Bunker', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' };
    }
  };

  const loginType = getLoginTypeDisplay();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5" />
            Your Nostr Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Login Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Login Method:</span>
            <Badge className={loginType.color}>
              {loginType.label}
            </Badge>
          </div>

          {/* Public Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Public Key (npub)</span>
              <Badge variant="outline" className="text-xs">
                Share this freely
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                {npub}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(npub, 'Public Key')}
                className="shrink-0"
              >
                {copiedField === 'Public Key' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Private Key - Only show if available */}
          {nsec && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Private Key (nsec)</span>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    Keep this secret!
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="h-6 w-6 p-0"
                  >
                    {showPrivateKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                  {showPrivateKey ? nsec : '•'.repeat(nsec.length)}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(nsec, 'Private Key')}
                  className="shrink-0"
                >
                  {copiedField === 'Private Key' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}



          {/* Security Notice */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Security Notice:</strong> Never share your private key (nsec) with anyone. 
              It's the only way to prove ownership of your Nostr identity.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
