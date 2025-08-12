import { useMemo, useState } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';
import { Image, X, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

/** Parses content of text note events so that URLs and hashtags are linkified. */
export function NoteContent({
  event, 
  className, 
}: NoteContentProps) {  
  // Process the content to render mentions, links, etc.
  const content = useMemo(() => {
    const text = event.content;
    
    // Enhanced regex to find URLs, Nostr references, hashtags, and images
    const regex = /(https?:\/\/[^\s]+)|nostr:(npub1|note1|nprofile1|nevent1)([023456789acdefghjklmnpqrstuvwxyz]+)|(#\w+)/g;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyCounter = 0;
    
    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, url, nostrPrefix, nostrData, hashtag] = match;
      const index = match.index;
      
      // Add text before this match
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }
      
      if (url) {
        // Check if this is an image URL - enhanced detection
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|avif|tiff|tif)$/i.test(url) || 
                       url.includes('blob:') ||
                       url.includes('data:image/') ||
                       url.includes('i.imgur.com') ||
                       url.includes('media.giphy.com') ||
                       url.includes('tenor.com') ||
                       url.includes('giphy.com');
        
        if (isImage) {
          // Render as an image
          parts.push(
            <ImageRenderer 
              key={`image-${keyCounter++}`}
              src={url}
              alt="Posted image"
            />
          );
        } else {
          // Handle regular URLs
          parts.push(
            <a 
              key={`url-${keyCounter++}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {url}
            </a>
          );
        }
      } else if (nostrPrefix && nostrData) {
        // Handle Nostr references
        try {
          const nostrId = `${nostrPrefix}${nostrData}`;
          const decoded = nip19.decode(nostrId);
          
          if (decoded.type === 'npub') {
            const pubkey = decoded.data;
            parts.push(
              <NostrMention key={`mention-${keyCounter++}`} pubkey={pubkey} />
            );
          } else {
            // For other types, just show as a link
            parts.push(
              <Link 
                key={`nostr-${keyCounter++}`}
                to={`/${nostrId}`}
                className="text-blue-500 hover:underline"
              >
                {fullMatch}
              </Link>
            );
          }
        } catch {
          // If decoding fails, just render as text
          parts.push(fullMatch);
        }
      } else if (hashtag) {
        // Handle hashtags
        const tag = hashtag.slice(1); // Remove the #
        parts.push(
          <Link 
            key={`hashtag-${keyCounter++}`}
            to={`/t/${tag}`}
            className="text-blue-500 hover:underline"
          >
            {hashtag}
          </Link>
        );
      }
      
      lastIndex = index + fullMatch.length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    // If no special content was found, just use the plain text
    if (parts.length === 0) {
      parts.push(text);
    }
    
    return parts;
  }, [event]);

  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {content.length > 0 ? content : event.content}
    </div>
  );
}

// Helper component to display user mentions
function NostrMention({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const hasRealName = !!author.data?.metadata?.name;
  const displayName = author.data?.metadata?.name ?? genUserName(pubkey);

  return (
    <Link 
      to={`/${npub}`}
      className={cn(
        "font-medium hover:underline",
        hasRealName 
          ? "text-blue-500" 
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      @{displayName}
    </Link>
  );
}

// Enhanced image renderer component
interface ImageRendererProps {
  src: string;
  alt: string;
}

function ImageRenderer({ src, alt }: ImageRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `nostr-image-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (hasError) {
    return (
      <div className="my-2 p-3 bg-muted/50 rounded-lg border border-dashed">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Image className="h-4 w-4" />
          <span className="text-sm">Failed to load image</span>
        </div>
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline mt-1 inline-block"
        >
          Open in new tab
        </a>
      </div>
    );
  }

  return (
    <div className="my-3">
      {/* Image Container */}
      <div className="relative group">
        {isLoading && (
          <div className="w-full h-48 bg-muted/50 rounded-lg animate-pulse flex items-center justify-center">
            <Image className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
        )}
        
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full rounded-lg transition-all duration-200",
            isLoading ? "hidden" : "block",
            "hover:shadow-lg cursor-pointer",
            "max-h-96 object-cover",
            "touch-manipulation" // Better touch handling on mobile
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={() => setIsExpanded(true)}
          loading="lazy" // Lazy loading for better performance
        />

        {/* Image Actions Overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              title="Download image"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(src, '_blank');
              }}
              title="Open in new tab"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Full Screen Image Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <div className="relative w-full h-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 h-10 w-10 p-0 bg-background/80 backdrop-blur-sm rounded-full"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-contain"
              draggable={false} // Prevent dragging on mobile
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}