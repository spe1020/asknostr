import { useState } from 'react';
import { Zap, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { generateSecretKey, nip19 } from 'nostr-tools';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useNostrPublish } from '@/hooks/useNostrPublish';

export function QuickSignup() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const loginActions = useLoginActions();
  const { mutate: publishEvent } = useNostrPublish();

  const handleCreateAccount = async () => {
    setIsCreating(true);

    try {
      // Generate new keypair using nostr-tools
      const secretKey = generateSecretKey();
      
      // Convert to nsec format
      const nsec = nip19.nsecEncode(secretKey);

      // Login with the new key
      loginActions.nsec(nsec);

      // Create a basic profile
      const basicProfile = {
        name: `Nostr User ${Math.random().toString(36).substring(2, 8)}`,
        about: "Just getting started with Nostr!",
        picture: ""
      };

      // Publish the profile
      publishEvent({
        kind: 0,
        content: JSON.stringify(basicProfile),
      }, {
        onSuccess: () => {
          toast({
            title: 'Account created! 🎉',
            description: 'Your Nostr identity is ready. You can now post questions and replies.',
          });
        },
        onError: () => {
          // Still show success even if profile creation fails
          toast({
            title: 'Account created! 🎉',
            description: 'Your Nostr identity is ready. You can update your profile later.',
          });
        }
      });

    } catch {
      toast({
        title: 'Failed to create account',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="bg-primary text-primary-foreground p-3 rounded-full">
                <UserPlus className="h-5 w-5" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-sm">Ready to join the conversation?</p>
              <p className="text-xs text-muted-foreground">
                Create your Nostr identity in one click
              </p>
            </div>
          </div>

          <Button
            onClick={handleCreateAccount}
            disabled={isCreating}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {isCreating ? (
              <>
                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                Create Account
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}