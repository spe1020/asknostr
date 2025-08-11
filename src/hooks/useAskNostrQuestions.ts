import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { countHashtags } from '@/lib/utils';

export type SortOption = 'recent' | 'most-replied' | 'most-zapped';

interface UseAskNostrQuestionsOptions {
  sortBy?: SortOption;
  limit?: number;
}

interface QuestionWithCounts {
  event: NostrEvent;
  replyCount: number;
  zapCount: number;
}

export function useAskNostrQuestions(options: UseAskNostrQuestionsOptions = {}) {
  const { sortBy = 'recent', limit = 50 } = options;
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['asknostr-questions', sortBy, limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      // Fetch root-level asknostr questions (no "e" tags = no replies)
      const events = await nostr.query([{
        kinds: [1],
        '#t': ['asknostr'],
        limit: limit * 2, // Fetch more to account for filtering
      }], { signal });

      // Filter out replies (events with "e" tags) and posts with too many hashtags
      const rootQuestions = events.filter(event => {
        // Filter out replies
        if (event.tags.some(tag => tag[0] === 'e')) {
          return false;
        }
        
        // Filter out posts with more than 3 hashtags (spam prevention)
        const hashtagCount = countHashtags(event.content);
        if (hashtagCount > 3) {
          return false;
        }
        
        return true;
      }).slice(0, limit);

      // If sorting by most replied, we need to count replies for each question
      if (sortBy === 'most-replied') {
        // If no questions, return empty array
        if (rootQuestions.length === 0) {
          return [];
        }
        
        const questionsWithCounts: QuestionWithCounts[] = [];
        
        // Calculate timestamp for 12 hours ago
        const twelveHoursAgo = Math.floor(Date.now() / 1000) - (12 * 60 * 60);
        
        // Get all question IDs to fetch replies for
        const questionIds = rootQuestions.map(q => q.id);
        
        // Fetch all replies for all questions within the past 12 hours in one query
        const allReplies = await nostr.query([{
          kinds: [1],
          '#e': questionIds,
          since: twelveHoursAgo,
          limit: 1000, // High limit to get all replies
        }], { signal });
        
        // Count replies per question
        for (const question of rootQuestions) {
          const replyCount = allReplies.filter(reply => 
            reply.tags.some(tag => tag[0] === 'e' && tag[1] === question.id)
          ).length;
          
          questionsWithCounts.push({
            event: question,
            replyCount,
            zapCount: 0, // We'll implement zap counting separately if needed
          });
        }
        
        // Sort by reply count (highest first)
        return questionsWithCounts
          .sort((a, b) => b.replyCount - a.replyCount)
          .map(item => item.event);
      }

      // If sorting by most zapped, we need to count zaps for each question
      if (sortBy === 'most-zapped') {
        // If no questions, return empty array
        if (rootQuestions.length === 0) {
          return [];
        }
        
        const questionsWithCounts: QuestionWithCounts[] = [];
        
        // Calculate timestamp for 12 hours ago
        const twelveHoursAgo = Math.floor(Date.now() / 1000) - (12 * 60 * 60);
        
        // Get all question IDs to fetch zaps for
        const questionIds = rootQuestions.map(q => q.id);
        
        // Fetch all zaps for all questions within the past 12 hours in one query
        const allZaps = await nostr.query([{
          kinds: [9735],
          '#e': questionIds,
          since: twelveHoursAgo,
          limit: 1000, // High limit to get all zaps
        }], { signal });
        
        // Count zaps per question
        for (const question of rootQuestions) {
          const zapCount = allZaps.filter(zap => 
            zap.tags.some(tag => tag[0] === 'e' && tag[1] === question.id)
          ).length;
          
          questionsWithCounts.push({
            event: question,
            replyCount: 0,
            zapCount,
          });
        }
        
        // Sort by zap count (highest first)
        return questionsWithCounts
          .sort((a, b) => b.zapCount - a.zapCount)
          .map(item => item.event);
      }

      // Default: sort by recent
      return rootQuestions.sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}