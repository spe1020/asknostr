import { X, Key, Globe, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WelcomeMessageProps {
  onDismiss: () => void;
  onOpenTutorial: () => void;
}

export function WelcomeMessage({ onDismiss, onOpenTutorial }: WelcomeMessageProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-primary">
            <Globe className="h-5 w-5" />
            <span>Welcome to AskNostr!</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm">
          This is a <strong>decentralized Q&A platform</strong> built on Nostr. 
          Unlike traditional platforms, you don't need usernames or passwords!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start space-x-2 p-3 bg-background rounded-lg">
            <Key className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Cryptographic Identity</p>
              <p className="text-xs text-muted-foreground">Your identity is a keypair, not a username</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 p-3 bg-background rounded-lg">
            <Globe className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Decentralized</p>
              <p className="text-xs text-muted-foreground">No single company controls your data</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 p-3 bg-background rounded-lg">
            <MessageCircle className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Ask & Answer</p>
              <p className="text-xs text-muted-foreground">Share knowledge with the community</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              #asknostr
            </Badge>
            <span className="text-xs text-muted-foreground">
              Questions are tagged with #asknostr
            </span>
          </div>
          
          <Button size="sm" onClick={onOpenTutorial} className="gap-2">
            <Key className="h-3 w-3" />
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}