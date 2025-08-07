import { useState } from 'react';
import { Send, User, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useAnonymousPost } from '@/hooks/useAnonymousPost';
import { useToast } from '@/hooks/useToast';
import { LoginArea } from '@/components/auth/LoginArea';

interface PostQuestionFormProps {
  onSuccess?: () => void;
}

export function PostQuestionForm({ onSuccess }: PostQuestionFormProps) {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { user } = useCurrentUser();
  const { mutate: publishSigned, isPending: isPublishingSigned } = useNostrPublish();
  const { mutate: publishAnonymous, isPending: isPublishingAnonymous } = useAnonymousPost();
  const { toast } = useToast();

  const isPublishing = isPublishingSigned || isPublishingAnonymous;
  const canPost = content.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canPost) return;

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
            onSuccess?.();
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
            onSuccess?.();
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Ask a Question</span>
          <Badge variant="outline">#asknostr</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="What would you like to ask the Nostr community?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isPublishing}
            />
            <p className="text-xs text-muted-foreground">
              💡 Your question will automatically include the #asknostr hashtag
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {user ? (
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant={isAnonymous ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsAnonymous(false)}
                    disabled={isPublishing}
                  >
                    <User className="h-4 w-4 mr-1" />
                    Signed
                  </Button>
                  <Button
                    type="button"
                    variant={isAnonymous ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsAnonymous(true)}
                    disabled={isPublishing}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Anonymous
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    <UserX className="h-3 w-3 mr-1" />
                    Anonymous posting only
                  </Badge>
                  <LoginArea className="max-w-32" />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={!canPost || isPublishing}
              size="sm"
            >
              <Send className="h-4 w-4 mr-1" />
              {isPublishing ? 'Posting...' : 'Post Question'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}