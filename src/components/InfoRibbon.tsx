import { useState } from 'react';
import { Info, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface InfoRibbonProps {
  onOpenTutorial: () => void;
}

export function InfoRibbon({ onOpenTutorial }: InfoRibbonProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Info className="h-4 w-4 text-primary" />
            <div className="flex items-center space-x-2 text-sm">
              <span>New to Nostr?</span>
              <Badge variant="outline" className="text-xs">No usernames needed</Badge>
              <span className="hidden sm:inline text-muted-foreground">
                • Your identity is a cryptographic keypair
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenTutorial}
              className="gap-1 text-xs h-7"
            >
              <HelpCircle className="h-3 w-3" />
              Learn More
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}