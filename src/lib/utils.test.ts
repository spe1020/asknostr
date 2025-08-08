import { describe, it, expect } from 'vitest';
import { countHashtags } from './utils';

describe('countHashtags', () => {
  it('should count basic hashtags', () => {
    expect(countHashtags('Hello #world #nostr')).toBe(2);
    expect(countHashtags('#asknostr question here')).toBe(1);
    expect(countHashtags('No hashtags here')).toBe(0);
  });

  it('should count hashtags with numbers and underscores', () => {
    expect(countHashtags('#asknostr #nostr_123 #test123')).toBe(3);
    expect(countHashtags('#word_with_underscores')).toBe(1);
  });

  it('should handle multiple hashtags in one word', () => {
    expect(countHashtags('#hashtag1#hashtag2')).toBe(2);
  });

  it('should handle empty string', () => {
    expect(countHashtags('')).toBe(0);
  });

  it('should handle string with only hashtags', () => {
    expect(countHashtags('#one #two #three #four')).toBe(4);
  });

  it('should not count incomplete hashtags', () => {
    expect(countHashtags('# #not #')).toBe(1); // Only #not counts
  });

  it('should handle hashtags with special characters', () => {
    expect(countHashtags('#hashtag-with-dashes')).toBe(1);
    expect(countHashtags('#hashtag_with_underscores')).toBe(1);
    expect(countHashtags('#hashtag123')).toBe(1);
  });

  it('should handle mixed content with hashtags', () => {
    expect(countHashtags('This is a question about #nostr and #asknostr #decentralized')).toBe(3);
  });
});
