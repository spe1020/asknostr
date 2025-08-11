// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import { useState } from 'react';
import { User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import LoginDialog from './LoginDialog';
import SignupDialog from './SignupDialog';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { AccountSwitcher } from './AccountSwitcher';
import { cn } from '@/lib/utils';

export interface LoginAreaProps {
  className?: string;
}

export function LoginArea({ className }: LoginAreaProps) {
  const { currentUser } = useLoggedInAccounts();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [signupDialogOpen, setSignupDialogOpen] = useState(false);

  const handleLogin = () => {
    setLoginDialogOpen(false);
    setSignupDialogOpen(false);
  };

  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      {currentUser ? (
        <AccountSwitcher onAddAccountClick={() => setLoginDialogOpen(true)} />
      ) : (
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => setLoginDialogOpen(true)}
            className='flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 hover:shadow-md'
          >
            <User className='w-4 h-4' />
            <span className='truncate'>Log in</span>
          </Button>
          <Button
            onClick={() => setSignupDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all border-2 hover:bg-muted hover:shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </Button>
        </div>
      )}

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
    </div>
  );
}