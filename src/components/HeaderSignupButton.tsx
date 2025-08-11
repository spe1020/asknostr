import { useState } from 'react';
import { Key, Unlock, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { generateSecretKey, nip19 } from 'nostr-tools';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useNostrPublish } from '@/hooks/useNostrPublish';

export function HeaderSignupButton() {
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
    <div className="flex items-center justify-center space-x-2">
      <div className="hidden md:flex items-center space-x-2 text-sm">
        <div className="relative">
          <div className="bg-primary text-primary-foreground p-2 rounded-full">
            <UserPlus className="h-4 w-4" />
          </div>
          <Sparkles className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-yellow-500 animate-pulse" />
        </div>
        <div className="text-xs">
          <p className="font-medium">Ready to join?</p>
          <p className="text-muted-foreground">Unlock your identity instantly</p>
        </div>
      </div>

      <Button
        onClick={handleCreateAccount}
        disabled={isCreating}
        size="sm"
        className="gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs px-3 py-1.5 h-8 whitespace-nowrap"
      >
        {isCreating ? (
          <>
            <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Key className="h-3 w-3" />
            <Unlock className="h-3 w-3" />
            <span className="hidden sm:inline">1-click</span>
            <span className="sm:hidden">1-click</span>
          </>
        )}
      </Button>
    </div>
  );
}
