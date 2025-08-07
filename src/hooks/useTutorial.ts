import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export function useTutorial() {
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage('asknostr-tutorial-seen', false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Remove auto-show behavior - tutorial is now accessed via ribbon/help button

  const closeTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
  };

  const openTutorial = () => {
    setShowTutorial(true);
  };

  return {
    showTutorial,
    closeTutorial,
    openTutorial,
    hasSeenTutorial,
  };
}