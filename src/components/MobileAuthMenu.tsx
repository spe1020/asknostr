import { useState } from 'react';
import { User, UserPlus, Key, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/useToast';
import { generateSecretKey, nip19 } from 'nostr-tools';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { AccountSwitcher } from '@/components/auth/AccountSwitcher';
import LoginDialog from '@/components/auth/LoginDialog';
import SignupDialog from '@/components/auth/SignupDialog';

export function MobileAuthMenu() {
  const [isCreating, setIsCreating] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [signupDialogOpen, setSignupDialogOpen] = useState(false);
  const { toast } = useToast();
  const loginActions = useLoginActions();
  const { mutate: publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();
  const { currentUser } = useLoggedInAccounts();

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

  const handleLogin = () => {
    setLoginDialogOpen(false);
    setSignupDialogOpen(false);
  };

  // If user is logged in, show account switcher
  if (user && currentUser) {
    return <AccountSwitcher onAddAccountClick={() => setLoginDialogOpen(true)} />;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 md:hidden">
            <User className="h-4 w-4" />
            <span>Account</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* 1-Click Account Creation */}
          <DropdownMenuItem 
            onClick={handleCreateAccount}
            disabled={isCreating}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <div className="relative">
              <div className="bg-primary text-primary-foreground p-2 rounded-full">
                <Key className="h-4 w-4" />
              </div>
              <Sparkles className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-yellow-500 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">1-Click Account</p>
              <p className="text-xs text-muted-foreground">Instant Nostr identity</p>
            </div>
            {isCreating && (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Manual Account Creation */}
          <DropdownMenuItem 
            onClick={() => setSignupDialogOpen(true)}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <div className="flex-1">
              <p className="font-medium text-sm">Create Account</p>
              <p className="text-xs text-muted-foreground">Import existing keys</p>
            </div>
          </DropdownMenuItem>

          {/* Login */}
          <DropdownMenuItem 
            onClick={() => setLoginDialogOpen(true)}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <User className="h-4 w-4" />
            <div className="flex-1">
              <p className="font-medium text-sm">Log In</p>
              <p className="text-xs text-muted-foreground">Use existing account</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onLogin={handleLogin}
        onSignup={() => setSignupDialogOpen(true)}
      />

      <SignupDialog
        isOpen={signupDialogOpen}
        onClose={() => setSignupDialogOpen(false)}
      />
    </>
  );
}
