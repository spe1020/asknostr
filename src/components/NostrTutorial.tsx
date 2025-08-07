import { useState } from 'react';
import { ChevronLeft, ChevronRight, Key, Globe, Shield, Zap, Users, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface NostrTutorialProps {
  open: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    title: "Welcome to Nostr",
    icon: Globe,
    content: (
      <div className="space-y-4">
        <p className="text-lg">
          Welcome to <strong>AskNostr</strong> and the world of <strong>Nostr</strong>!
        </p>
        <p>
          Nostr is a revolutionary protocol that's changing how we think about social media and online identity. 
          Unlike traditional platforms, Nostr gives you true ownership of your identity and data.
        </p>
        <div className="bg-muted p-4 rounded-lg">
          <p className="font-semibold text-primary">What makes Nostr different?</p>
          <p className="text-sm mt-1">
            No usernames, no passwords, no accounts to create. Just you and your cryptographic keys.
          </p>
        </div>
      </div>
    )
  },
  {
    title: "No More Usernames & Passwords",
    icon: Key,
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-700 dark:text-red-300">Legacy Internet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>❌ Create accounts on every platform</p>
              <p>❌ Remember dozens of passwords</p>
              <p>❌ Hope usernames are available</p>
              <p>❌ Risk data breaches</p>
              <p>❌ Lose access if banned</p>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700 dark:text-green-300">Nostr</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>✅ One identity everywhere</p>
              <p>✅ No passwords to remember</p>
              <p>✅ Your identity is always yours</p>
              <p>✅ Cryptographically secure</p>
              <p>✅ Censorship resistant</p>
            </CardContent>
          </Card>
        </div>
        
        <p>
          Your identity on Nostr is simply a <strong>cryptographic keypair</strong>. 
          Think of it as a digital fingerprint that's uniquely yours and impossible to fake.
        </p>
      </div>
    )
  },
  {
    title: "Your Cryptographic Identity",
    icon: Shield,
    content: (
      <div className="space-y-4">
        <p>
          Instead of usernames and passwords, Nostr uses <strong>public-private key cryptography</strong>:
        </p>
        
        <div className="space-y-3">
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 text-white p-2 rounded-full">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300">Public Key (npub)</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Like your username, but cryptographically unique. Share this freely!
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    npub1abc123...
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-500 text-white p-2 rounded-full">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-700 dark:text-purple-300">Private Key (nsec)</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Like your password, but much more secure. Keep this secret!
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    nsec1xyz789...
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 p-4 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Important:</strong> Your private key (nsec) is like a master password for your entire Nostr identity. 
            Never share it with anyone!
          </p>
        </div>
      </div>
    )
  },
  {
    title: "How It Works",
    icon: Zap,
    content: (
      <div className="space-y-4">
        <p>Here's how your Nostr identity works in practice:</p>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <h4 className="font-semibold">Generate Your Keys</h4>
              <p className="text-sm text-muted-foreground">
                Create a unique keypair or use a browser extension like Alby
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <h4 className="font-semibold">Sign Your Messages</h4>
              <p className="text-sm text-muted-foreground">
                Every post is cryptographically signed with your private key
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <h4 className="font-semibold">Verify Authenticity</h4>
              <p className="text-sm text-muted-foreground">
                Others can verify your messages using your public key
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
            <div>
              <h4 className="font-semibold">Use Anywhere</h4>
              <p className="text-sm text-muted-foreground">
                Your identity works on any Nostr app or relay
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          No central authority can ban you, delete your account, or steal your identity. 
          You own your keys, you own your identity.
        </p>
      </div>
    )
  },
  {
    title: "Getting Started",
    icon: Users,
    content: (
      <div className="space-y-4">
        <p>Ready to join the Nostr network? You have two options:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-base text-green-700 dark:text-green-300">
                🔐 Sign In (Recommended)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Use a browser extension like <strong>Alby</strong> or import your existing keys.</p>
              <p className="text-green-600 dark:text-green-400">
                ✅ Persistent identity<br/>
                ✅ Build reputation<br/>
                ✅ Connect with others
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-base text-blue-700 dark:text-blue-300">
                👤 Post Anonymously
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Generate temporary keys for each post. Perfect for trying things out.</p>
              <p className="text-blue-600 dark:text-blue-400">
                ✅ Complete privacy<br/>
                ✅ No commitment<br/>
                ✅ Instant posting
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
          <h4 className="font-semibold text-primary mb-2">About #asknostr</h4>
          <p className="text-sm">
            This app focuses on the <strong>#asknostr</strong> community - a place where people ask questions 
            and share knowledge. It's like a decentralized Stack Overflow or Reddit, but you own your data!
          </p>
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          Welcome to the future of social media. Welcome to Nostr! 🚀
        </p>
      </div>
    )
  }
];

export function NostrTutorial({ open, onClose }: NostrTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-primary" />
              <span>{step.title}</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Content */}
          <div className="min-h-[300px]">
            {step.content}
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {currentStep === tutorialSteps.length - 1 ? (
              <Button onClick={onClose} className="gap-2">
                Get Started
                <Zap className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={nextStep} className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}