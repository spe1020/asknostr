import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import { useNostr } from '@/hooks/useNostr';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { genUserName } from '@/lib/genUserName';
import { NoteContent } from '@/components/NoteContent';
import NotFound from './NotFound';

// Type definitions for NIP-19 decoded data
interface NIP19Decoded {
  type: string;
  data: unknown;
}

interface ProfileData {
  pubkey: string;
  relays?: string[];
  petname?: string;
}

interface AddressableEventData {
  pubkey: string;
  kind: number;
  identifier: string;
}

interface EventData {
  id: string;
}

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();
  const navigate = useNavigate();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type } = decoded;

  switch (type) {
    case 'npub':
    case 'nprofile':
      return <ProfileView decoded={decoded} navigate={navigate} />;

    case 'note':
      return <NoteView decoded={decoded} navigate={navigate} />;

    case 'nevent':
      return <EventView decoded={decoded} navigate={navigate} />;

    case 'naddr':
      return <AddressableEventView decoded={decoded} navigate={navigate} />;

    default:
      return <NotFound />;
  }
}

// Profile View Component
function ProfileView({ decoded, navigate }: { decoded: NIP19Decoded; navigate: (delta: number) => void }) {
  const { nostr } = useNostr();
  const pubkey = decoded.type === 'npub' ? decoded.data as string : (decoded.data as ProfileData).pubkey;
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', pubkey],
    queryFn: async () => {
      const events = await nostr.query([{ kinds: [0], authors: [pubkey], limit: 1 }]);
      return events[0] || null;
    },
  });

  const { data: recentNotes } = useQuery({
    queryKey: ['recent-notes', pubkey],
    queryFn: async () => {
      const events = await nostr.query([{ kinds: [1], authors: [pubkey], limit: 10 }]);
      return events;
    },
    enabled: !!profile,
  });

  const displayName = profile?.content ? JSON.parse(profile.content).name : genUserName(pubkey);
  const metadata = profile?.content ? JSON.parse(profile.content) : {};
  const npub = nip19.npubEncode(pubkey);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={metadata.picture} alt={displayName} />
              <AvatarFallback className="text-2xl">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {metadata.nip05 && (
                  <Badge variant="secondary">
                    {metadata.nip05}
                  </Badge>
                )}
              </div>
              
              {metadata.about && (
                <p className="text-muted-foreground text-lg">
                  {metadata.about}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Public Key: {npub.slice(0, 12)}...{npub.slice(-12)}</span>
                {metadata.website && (
                  <a 
                    href={metadata.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center space-x-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Recent Notes */}
      {recentNotes && recentNotes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Notes</h2>
          {recentNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={metadata.picture} alt={displayName} />
                    <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(note.created_at * 1000), { addSuffix: true })}</span>
                  </div>
                </div>
                <NoteContent event={note} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Note View Component
function NoteView({ decoded, navigate }: { decoded: NIP19Decoded; navigate: (delta: number) => void }) {
  const { nostr } = useNostr();
  const noteId = decoded.data as string;
  
  const { data: note, isLoading } = useQuery({
    queryKey: ['note', noteId],
    queryFn: async () => {
      const events = await nostr.query([{ ids: [noteId], limit: 1 }]);
      return events[0] || null;
    },
  });

  if (isLoading) {
    return <NoteSkeleton />;
  }

  if (!note) {
    return <NotFound />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardContent className="p-6">
          <NoteContent event={note} />
        </CardContent>
      </Card>
    </div>
  );
}

// Event View Component
function EventView({ decoded, navigate }: { decoded: NIP19Decoded; navigate: (delta: number) => void }) {
  const { nostr } = useNostr();
  const eventId = (decoded.data as EventData).id;
  
  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await nostr.query([{ ids: [eventId], limit: 1 }]);
      return events[0] || null;
    },
  });

  if (isLoading) {
    return <EventSkeleton />;
  }

  if (!event) {
    return <NotFound />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <Badge variant="outline">Event Type: {event.kind}</Badge>
          </div>
          <NoteContent event={event} />
        </CardContent>
      </Card>
    </div>
  );
}

// Addressable Event View Component
function AddressableEventView({ decoded, navigate }: { decoded: NIP19Decoded; navigate: (delta: number) => void }) {
  const { nostr } = useNostr();
  const { pubkey, kind, identifier } = decoded.data as AddressableEventData;
  
  const { data: event, isLoading } = useQuery({
    queryKey: ['addressable-event', pubkey, kind, identifier],
    queryFn: async () => {
      const events = await nostr.query([{ 
        kinds: [kind], 
        authors: [pubkey], 
        '#d': [identifier],
        limit: 1 
      }]);
      return events[0] || null;
    },
  });

  if (isLoading) {
    return <AddressableEventSkeleton />;
  }

  if (!event) {
    return <NotFound />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Addressable Event</h1>
              <p className="text-muted-foreground">
                Kind {kind} • Identifier: {identifier}
              </p>
            </div>
            <Badge variant="outline">Kind {kind}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <NoteContent event={event} />
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton Components
function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Skeleton className="h-10 w-24 mb-6" />
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-start space-x-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-96" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

function NoteSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Skeleton className="h-10 w-24 mb-6" />
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Skeleton className="h-10 w-24 mb-6" />
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}

function AddressableEventSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Skeleton className="h-10 w-24 mb-6" />
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
} 