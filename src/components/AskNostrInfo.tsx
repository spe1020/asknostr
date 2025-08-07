import { MessageCircle, Users, Zap, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AskNostrInfo() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>About #asknostr</span>
          <Badge variant="outline" className="text-xs">#asknostr</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          The #asknostr community is where Nostr users ask questions and share knowledge. 
          Think of it as a decentralized Stack Overflow or Reddit, but you own your data!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4 text-blue-500" />
            <span>Community-driven</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Globe className="h-4 w-4 text-green-500" />
            <span>Decentralized</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Zap great answers</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Questions and answers are stored on the Nostr network, making them censorship-resistant and owned by you.
        </p>
      </CardContent>
    </Card>
  );
}