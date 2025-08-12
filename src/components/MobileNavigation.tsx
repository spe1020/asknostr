import { useState, useRef, useEffect } from 'react';
import { Home, Search, Plus, MessageCircle, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import { useTouchGestures } from '@/hooks/useTouchGestures';

interface MobileNavigationProps {
  onHomeClick?: () => void;
  onSearchClick?: () => void;
  onNewQuestionClick?: () => void;
  onMessagesClick?: () => void;
  onProfileClick?: () => void;
  currentPath?: string;
  className?: string;
}

export function MobileNavigation({
  onHomeClick,
  onSearchClick,
  onNewQuestionClick,
  onMessagesClick,
  onProfileClick,
  currentPath = '/',
  className,
}: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const { user } = useCurrentUser();
  const isMobile = useIsMobile();
  const navRef = useRef<HTMLDivElement>(null);

  // Touch gestures for navigation
  const { attachGestures } = useTouchGestures({
    onSwipeLeft: () => {
      // Navigate to next tab
      const tabs = ['home', 'search', 'new', 'messages', 'profile'];
      const currentIndex = tabs.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
    },
    onSwipeRight: () => {
      // Navigate to previous tab
      const tabs = ['home', 'search', 'new', 'messages', 'profile'];
      const currentIndex = tabs.indexOf(activeTab);
      const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      setActiveTab(tabs[prevIndex]);
    },
  });

  useEffect(() => {
    if (navRef.current) {
      return attachGestures(navRef.current);
    }
  }, [attachGestures]);

  // Don't render on desktop
  if (!isMobile) return null;

  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: 'Home',
      onClick: onHomeClick,
      active: currentPath === '/' || activeTab === 'home',
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search',
      onClick: onSearchClick,
      active: activeTab === 'search',
    },
    {
      id: 'new',
      icon: Plus,
      label: 'Ask',
      onClick: onNewQuestionClick,
      active: activeTab === 'new',
      primary: true,
    },
    {
      id: 'messages',
      icon: MessageCircle,
      label: 'Messages',
      onClick: onMessagesClick,
      active: activeTab === 'messages',
    },
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      onClick: onProfileClick,
      active: activeTab === 'profile',
    },
  ];

  const handleTabClick = (item: typeof navItems[0]) => {
    setActiveTab(item.id);
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div
        ref={navRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t",
          "safe-area-inset-bottom", // iOS safe area support
          className
        )}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handleTabClick(item)}
              className={cn(
                "flex flex-col items-center justify-center h-16 w-16 rounded-xl transition-all duration-200",
                "hover:bg-accent/50 active:scale-95",
                item.active && "bg-accent text-accent-foreground",
                item.primary && "bg-primary text-primary-foreground hover:bg-primary/90",
                item.primary && item.active && "ring-2 ring-primary/20"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Actions Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <span>Quick Actions</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
                className="ml-auto h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNewQuestionClick?.();
                }}
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Ask Question</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => {
                  setIsMenuOpen(false);
                  onSearchClick?.();
                }}
              >
                <Search className="h-6 w-6" />
                <span className="text-sm font-medium">Search</span>
              </Button>
            </div>

            {/* User-specific actions */}
            {user && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onProfileClick?.();
                  }}
                >
                  <User className="h-4 w-4 mr-3" />
                  Edit Profile
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onMessagesClick?.();
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-3" />
                  My Messages
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom safe area spacer */}
      <div className="h-20" />
    </>
  );
}
