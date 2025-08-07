import { useState } from 'react';
import { Key, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { generateSecretKey } from 'nostr-tools';
import { useLoginActions } from '@/hooks/useLoginActions';

export function QuickSignup() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const loginActions = useLoginActions();

  const handleCreateAccount = async () => {
    setIsCreating(true);

    try {
      // Generate new keypair
      const secretKey = generateSecretKey();

      // Convert to hex for nsec format
      const secretKeyHex = Array.from(secretKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Login with the new key using nsec method
      loginActions.nsec(secretKeyHex);

      toast({
        title: 'Account created! 🎉',
        description: 'You can now post questions and replies. Your keys are saved locally.',
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
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-full">
              <Key className="h-4 w-4" />
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
            className="gap-2"
          >
            <Zap className="h-3 w-3" />
            {isCreating ? 'Creating...' : 'Create Account'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}