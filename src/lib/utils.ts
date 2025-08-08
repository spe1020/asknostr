import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Count the number of hashtags in a string
 * @param content - The text content to analyze
 * @returns The number of hashtags found
 */
export function countHashtags(content: string): number {
  // Match hashtags that start with # and contain word characters
  // This regex matches #word, #word123, #word_with_underscores, etc.
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  const matches = content.match(hashtagRegex);
  return matches ? matches.length : 0;
}
