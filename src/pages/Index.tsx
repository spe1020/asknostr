import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { QuestionsFeed } from '@/components/QuestionsFeed';
import { ThreadView } from '@/components/ThreadView';
import { LoginArea } from '@/components/auth/LoginArea';
import { RelaySelector } from '@/components/RelaySelector';
import { NostrTutorial } from '@/components/NostrTutorial';
import { InfoRibbon } from '@/components/InfoRibbon';
import { useTutorial } from '@/hooks/useTutorial';

const Index = () => {
  const [selectedQuestion, setSelectedQuestion] = useState<NostrEvent | null>(null);
  const { showTutorial, closeTutorial, openTutorial } = useTutorial();

  useSeoMeta({
    title: 'AskNostr - Decentralized Q&A on Nostr',
    description: 'A minimalist Nostr web client focused on the #asknostr tag. Ask questions, share knowledge, and connect with the Nostr community.',
  });

  const handleQuestionClick = (event: NostrEvent) => {
    setSelectedQuestion(event);
  };

  const handleBackToFeed = () => {
    setSelectedQuestion(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Info Ribbon */}
      <InfoRibbon onOpenTutorial={openTutorial} />

      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">AskNostr</h1>
              {!selectedQuestion && (
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Decentralized Q&A on Nostr
                </p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <RelaySelector className="max-w-48" />
              <LoginArea className="max-w-40" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {selectedQuestion ? (
          <ThreadView
            rootEvent={selectedQuestion}
            onBack={handleBackToFeed}
          />
        ) : (
          <QuestionsFeed onQuestionClick={handleQuestionClick} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Powered by <a href="https://nostr.com" className="underline hover:text-foreground">Nostr</a>
            </p>
            <p>
              Vibed with <a href="https://soapbox.pub/mkstack" className="underline hover:text-foreground">MKStack</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Tutorial */}
      <NostrTutorial open={showTutorial} onClose={closeTutorial} />
    </div>
  );
};

export default Index;
