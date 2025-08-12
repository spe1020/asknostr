import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useAnonymousPost } from '@/hooks/useAnonymousPost';
import { useToast } from '@/hooks/useToast';
import { countHashtags } from '@/lib/utils';

const PROMPT_QUESTIONS = [
  "What's the hardest run or workout you've ever completed — and what kept you going? #runstr #powr",
  "Have you ever traded or bartered food from your garden? What was the deal?",
  "Have you ever lost Bitcoin? What lesson did you take from it?",
  "If you could change one thing about how Nostr works right now, what would it be?",
  "How do you explain permaculture to kids or someone totally new?",
  "How do you track progress in a way that keeps you motivated — beyond pace or weight? #powr",
  "What's your personal strategy for avoiding burnout on social media — decentralized or otherwise?",
  "How has holding Bitcoin changed your perspective on money over time?",
  "What's your \"hook\" when convincing a friend to try Nostr?",
  "If Nostr vanished tomorrow, what part of it would you miss the most?",
  "How do you balance structured training with just having fun? #runstr #powr",
  "What's the most clever way you've reused or recycled materials in your garden design?",
  "What's your dream Nostr feature that doesn't exist yet?",
  "What's your go-to stack for building Nostr apps?",
  "What's your Bitcoin \"security stack,\" and how has it evolved?",
  "What's the most underrated exercise or drill you wish more people did? #powr",
  "Who's the most interesting person you've discovered on Nostr, and why?",
  "What's the most successful permaculture project you've tried, and what made it work?",
  "How do you personally deal with spam or trolls on Nostr?",
  "When did you first \"get\" Bitcoin — and what triggered the lightbulb moment?",
  "What recovery method actually works best for you after a brutal session? #runstr #powr",
  "What plant or tree has given you the biggest return in food or value over the years?",
  "Have you ever made a real-life friend through Nostr? How did it happen?",
  "What's your favorite way to earn Bitcoin instead of buying it?",
  "How do you design for resilience against drought, pests, or unpredictable weather?",
  "Have you ever experimented with ephemeral events? What's the use case?",
  "What's your best story about convincing someone to accept Bitcoin?",
  "What's your most unconventional composting method that actually works?",
  "What post, thread, or conversation made you feel like Nostr was \"different\" from other platforms?",
  "How do you filter or prioritize your Nostr feed so it feels signal-heavy, not noise-heavy?",
  "How do you balance running with strength training? #runstr #powr",
  "What's the most meaningful purchase you've ever made with Bitcoin?",
  "If hyperbitcoinization happened tomorrow, what part of life would change first for you?",
  "What piece of gear was a total game-changer for your training? #runstr #powr",
  "What's the one permaculture principle you wish more people understood?",
  "What's the one Nostr post you've made that got the most unexpected reaction?",
  "What's the most underrated NIP that deserves more attention?",
  "How do you keep your keys safe but still accessible for posting?",
  "If you could rewrite one NIP from scratch, which would it be and why?",
  "What's your favorite way to use Nostr that most people overlook?",
  "How do you design a rainwater catchment system?",
  "How do you stay motivated when training for a race? #runstr",
  "What's one change to your training that gave you surprising results? #powr",
  "What's your favorite piece of fitness gear you can't train without? #runstr #powr",
  "If someone only had $100 to start a permaculture project, how should they spend it?",
  "Have you ever trained for something that seemed impossible at first? What happened? #runstr #powr",
  "Do you think Lightning micropayments will change how we consume media? Why or why not?",
  "How do you filter your Nostr experience to avoid information overload?",
  "What's your favorite way to earn Bitcoin from your work or hobbies?",
  "What's one \"garden failure\" that taught you more than a success?"
];

export function HomepagePrompt() {
  const [content, setContent] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
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
      if (user) {
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
      } else {
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
    <Card id="homepage-prompt" className="border border-muted bg-muted/30 mb-6">
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
                <span className="text-xs text-muted-foreground">
                  💡 Your question will automatically include the #asknostr hashtag
                </span>
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
