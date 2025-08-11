import { useState, useEffect } from 'react';
import { Send, Hash, User, Shield, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useAnonymousPost } from '@/hooks/useAnonymousPost';
import { useToast } from '@/hooks/useToast';
import { countHashtags } from '@/lib/utils';

const PROMPT_QUESTIONS = [
  "What's the best way to get started with Nostr?",
  "How do I find interesting people to follow on Nostr?",
  "What are your favorite Bitcoin Lightning apps?",
  "Any good book recommendations for crypto beginners?",
  "What's your go-to recipe for a quick dinner?",
  "How do you stay productive while working remotely?",
  "What's the most underrated Nostr client feature?",
  "How do you manage your private keys securely?",
  "What's your favorite way to discover new content?",
  "How do you handle information overload online?",
  "What's the best tip you've learned about Bitcoin?",
  "How do you organize your digital life?",
  "What's your favorite decentralized app?",
  "How do you stay motivated in your daily routine?",
  "What's the most valuable lesson you've learned recently?"
];

export function HomepagePrompt() {
  const [content, setContent] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { user } = useCurrentUser();
  const { mutate: publishSigned, isPending: isPublishingSigned } = useNostrPublish();
  const { mutate: publishAnonymous, isPending: isPublishingAnonymous } = useAnonymousPost();
  const { toast } = useToast();

  const isPublishing = isPublishingSigned || isPublishingAnonymous;
  const canPost = content.trim().length > 0;
  const hashtagCount = countHashtags(content);
  const isOverLimit = hashtagCount > 3;

  // Rotate through prompt questions every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % PROMPT_QUESTIONS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canPost || isOverLimit) return;

    const questionContent = content.trim() + '\n\n#asknostr';
    const tags = [['t', 'asknostr']];

    try {
      if (isAnonymous || !user) {
        // Post anonymously
        publishAnonymous({
          content: questionContent,
          tags,
          kind: 1,
        }, {
          onSuccess: () => {
            setContent('');
            toast({
              title: 'Question posted anonymously!',
              description: 'Your question has been published to the #asknostr feed.',
            });
          },
          onError: (err) => {
            toast({
              title: 'Failed to post question',
              description: err.message,
              variant: 'destructive',
            });
          },
        });
      } else {
        // Post with signed-in user
        publishSigned({
          kind: 1,
          content: questionContent,
          tags,
        }, {
          onSuccess: () => {
            setContent('');
            toast({
              title: 'Question posted!',
              description: 'Your question has been published to the #asknostr feed.',
            });
          },
          onError: (err) => {
            toast({
              title: 'Failed to post question',
              description: err.message,
              variant: 'destructive',
            });
          },
        });
      }
    } catch {
      toast({
        title: 'Failed to post question',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border border-muted bg-muted/30 mb-6">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              What do you want to ask Nostr?
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Textarea
                placeholder={PROMPT_QUESTIONS[currentPromptIndex]}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] resize-none text-base transition-all duration-500"
                disabled={isPublishing}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    #asknostr
                  </Badge>
                  {user && (
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant={isAnonymous ? "outline" : "default"}
                        size="sm"
                        onClick={() => setIsAnonymous(false)}
                        disabled={isPublishing}
                        className="flex items-center space-x-1 h-6 px-2"
                      >
                        <User className="h-3 w-3" />
                        <span className="text-xs">Signed</span>
                      </Button>
                      <Switch
                        checked={isAnonymous}
                        onCheckedChange={setIsAnonymous}
                        disabled={isPublishing}
                        className="scale-75"
                      />
                      <Button
                        type="button"
                        variant={isAnonymous ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsAnonymous(true)}
                        disabled={isPublishing}
                        className="flex items-center space-x-1 h-6 px-2"
                      >
                        <Shield className="h-3 w-3" />
                        <span className="text-xs">Anonymous</span>
                      </Button>
                      {isAnonymous && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Key className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-2">
                                <p className="font-medium">🔐 Anonymous Posting</p>
                                <p className="text-sm">
                                  Each anonymous post generates a unique, one-time cryptographic key that's 
                                  immediately discarded after publishing. This ensures complete privacy.
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
                  {!user && (
                    <Badge variant="secondary" className="text-xs flex items-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>Anonymous</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Key className="h-3 w-3 ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2">
                              <p className="font-medium">🔐 Anonymous Posting</p>
                              <p className="text-sm">
                                Each anonymous post generates a unique, one-time cryptographic key that's 
                                immediately discarded after publishing. This ensures complete privacy - 
                                even we can't trace your posts back to you!
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Perfect for sensitive questions or when you want to maintain privacy.
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {hashtagCount}/3 hashtags
                    </span>
                  </div>
                  {isOverLimit && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-destructive cursor-help">
                            Too many hashtags
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Posts with more than 3 hashtags are filtered out to prevent spam.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={!canPost || isPublishing || isOverLimit}
                size="default"
                className="px-6"
              >
                <Send className="h-4 w-4 mr-2" />
                {isPublishing ? 'Posting...' : 'Ask Nostr'}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
