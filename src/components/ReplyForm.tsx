import { useState } from 'react';
import { Send, User, Key, Shield } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface ReplyFormProps {
  rootEvent: NostrEvent;
  onSuccess?: () => void;
}

export function ReplyForm({ rootEvent, onSuccess }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { user } = useCurrentUser();
  const { mutate: publishSigned, isPending: isPublishingSigned } = useNostrPublish();
  const { mutate: publishAnonymous, isPending: isPublishingAnonymous } = useAnonymousPost();
  const { toast } = useToast();

  const isPublishing = isPublishingSigned || isPublishingAnonymous;
  const canPost = content.trim().length > 0;
  const hashtagCount = countHashtags(content);
  const isOverLimit = hashtagCount > 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canPost || isOverLimit) return;

    const replyContent = content.trim();
    const tags = [
      ['e', rootEvent.id], // Reference to the root question
      ['p', rootEvent.pubkey], // Reference to the original poster
    ];

    try {
      if (isAnonymous || !user) {
        // Post anonymously
        publishAnonymous({
          content: replyContent,
          tags,
          kind: 1,
        }, {
          onSuccess: () => {
            setContent('');
            toast({
              title: 'Reply posted anonymously!',
              description: 'Your reply has been published.',
            });
            onSuccess?.();
          },
          onError: (err) => {
            toast({
              title: 'Failed to post reply',
              description: err.message,
              variant: 'destructive',
            });
          },
        });
      } else {
        // Post with signed-in user
        publishSigned({
          kind: 1,
          content: replyContent,
          tags,
        }, {
          onSuccess: () => {
            setContent('');
            toast({
              title: 'Reply posted!',
              description: 'Your reply has been published.',
            });
            onSuccess?.();
          },
          onError: (err) => {
            toast({
              title: 'Failed to post reply',
              description: err.message,
              variant: 'destructive',
            });
          },
        });
      }
    } catch {
      toast({
        title: 'Failed to post reply',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Reply to this question</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Share your thoughts or answer..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isPublishing}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Share your knowledge or thoughts
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant={isAnonymous ? "outline" : "default"}
                      size="sm"
                      onClick={() => setIsAnonymous(false)}
                      disabled={isPublishing}
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Signed</span>
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isAnonymous}
                        onCheckedChange={setIsAnonymous}
                        disabled={isPublishing}
                      />
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant={isAnonymous ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsAnonymous(true)}
                          disabled={isPublishing}
                          className="flex items-center space-x-2"
                        >
                          <Shield className="h-4 w-4" />
                          <span>Anonymous</span>
                        </Button>
                        {isAnonymous && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Key className="h-4 w-4 text-muted-foreground cursor-help" />
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
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>Anonymous posting</span>
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
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={!canPost || isPublishing || isOverLimit}
              size="sm"
            >
              <Send className="h-4 w-4 mr-1" />
              {isPublishing ? 'Posting...' : 'Ask Nostr'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}