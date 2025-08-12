import { useMemo, useState, useEffect } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { useNostr } from '@/hooks/useNostr';
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
          } else if (decoded.type === 'note') {
            // Handle note references - fetch and display the note content
            parts.push(
              <NostrNoteReference 
                key={`note-${keyCounter++}`} 
                noteId={decoded.data} 
                originalText={fullMatch}
              />
            );
          } else if (decoded.type === 'nevent') {
            // Handle event references
            parts.push(
              <NostrEventReference 
                key={`event-${keyCounter++}`} 
                _eventData={decoded.data} 
                originalText={fullMatch}
              />
            );
          } else if (decoded.type === 'nprofile') {
            // Handle profile references - display profile information inline
            parts.push(
              <NostrProfileReference 
                key={`profile-${keyCounter++}`} 
                profileData={decoded.data} 
                originalText={fullMatch}
              />
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

// Nostr note reference component - fetches and displays referenced note content
interface NostrNoteReferenceProps {
  noteId: string;
  originalText: string;
}

function NostrNoteReference({ noteId, originalText }: NostrNoteReferenceProps) {
  const { nostr } = useNostr();
  const [noteContent, setNoteContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch the referenced note
  useEffect(() => {
    const fetchNote = async () => {
      try {
        setIsLoading(true);
        const events = await nostr.query([{ ids: [noteId] }]);
        if (events.length > 0) {
          setNoteContent(events[0].content);
        } else {
          setHasError(true);
        }
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [noteId, nostr]);

  if (isLoading) {
    return (
      <div className="inline-block">
        <span className="text-blue-500 hover:underline cursor-pointer">
          {originalText}
        </span>
        <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-dashed animate-pulse">
          <div className="h-4 bg-muted rounded w-32"></div>
          <div className="h-3 bg-muted rounded w-48 mt-2"></div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <Link 
        to={`/${originalText}`}
        className="text-blue-500 hover:underline"
      >
        {originalText}
      </Link>
    );
  }

  if (!noteContent) {
    return (
      <Link 
        to={`/${originalText}`}
        className="text-blue-500 hover:underline"
      >
        {originalText}
      </Link>
    );
  }

  return (
    <div className="inline-block">
      <span className="text-blue-500 hover:underline cursor-pointer" onClick={() => setIsExpanded(true)}>
        {originalText}
      </span>
      
      {/* Inline note preview */}
      <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
        <div className="text-sm text-muted-foreground mb-2">Referenced note:</div>
        <div className="text-sm whitespace-pre-wrap break-words">
          {noteContent.length > 200 
            ? `${noteContent.slice(0, 200)}...` 
            : noteContent
          }
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Link 
            to={`/${originalText}`}
            className="text-xs text-blue-500 hover:underline"
          >
            View full note →
          </Link>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => setIsExpanded(true)}
          >
            Expand
          </Button>
        </div>
      </div>

      {/* Full note dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Referenced Note</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="whitespace-pre-wrap break-words text-sm">
                {noteContent}
              </div>
            </div>
            <div className="flex justify-end">
              <Link 
                to={`/${originalText}`}
                className="text-blue-500 hover:underline text-sm"
              >
                View in full page →
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Nostr event reference component - handles nevent references
interface NostrEventReferenceProps {
  _eventData: unknown;
  originalText: string;
}

function NostrEventReference({ _eventData, originalText }: NostrEventReferenceProps) {
  return (
    <Link 
      to={`/${originalText}`}
      className="text-blue-500 hover:underline"
    >
      {originalText}
    </Link>
  );
}

// Nostr profile reference component - displays profile information inline
interface NostrProfileReferenceProps {
  profileData: {
    pubkey: string;
    relays?: string[];
    petname?: string;
  };
  originalText: string;
}

function NostrProfileReference({ profileData, originalText }: NostrProfileReferenceProps) {
  const { pubkey, relays, petname } = profileData;
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const metadata = author.data?.metadata;
  
  const displayName = petname || metadata?.name || genUserName(pubkey);
  const profileImage = metadata?.picture;
  const about = metadata?.about;
  const nip05 = metadata?.nip05;

  return (
    <div className="inline-block">
      <span className="text-blue-500 hover:underline cursor-pointer">
        {originalText}
      </span>
      
      {/* Inline profile preview */}
      <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
        <div className="flex items-start space-x-3">
          {/* Profile Avatar */}
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm">{displayName}</span>
              {nip05 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {nip05}
                </span>
              )}
            </div>
            
            {about && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {about}
              </p>
            )}
            
            {relays && relays.length > 0 && (
              <div className="mt-2 flex items-center space-x-1">
                <span className="text-xs text-muted-foreground">Relays:</span>
                <div className="flex space-x-1">
                  {relays.slice(0, 3).map((relay, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-muted px-2 py-1 rounded"
                      title={relay}
                    >
                      {relay.replace(/^wss?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  ))}
                  {relays.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{relays.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Links */}
        <div className="mt-3 flex items-center justify-between">
          <Link 
            to={`/${npub}`}
            className="text-xs text-blue-500 hover:underline"
          >
            View profile →
          </Link>
          <span className="text-xs text-muted-foreground">
            {petname ? `Petname: ${petname}` : 'No petname'}
          </span>
        </div>
      </div>
    </div>
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