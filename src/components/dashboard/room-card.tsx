
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LogIn } from 'lucide-react';
import type { Room } from '@/lib/types';

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const imageUrl = room.image || 'https://placehold.co/600x400.png';
  const altText = room.name || 'CommuniVerse room image';
  
  let aiHint = 'social chat'; // Default hint
  if (room.name) {
    aiHint = room.name.toLowerCase().split(' ').slice(0, 2).join(' ');
  } else if (room.image?.includes('placehold.co')) {
    // If it's a placeholder and no name, keep a generic one or try to derive from description if needed
    aiHint = 'abstract background'; 
  }


  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        {/* No need for room.image && check here if imageUrl provides a fallback */}
        <div className="relative h-40 w-full mb-4 rounded-t-md overflow-hidden">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            style={{ objectFit: 'cover' }}
            data-ai-hint={aiHint}
            priority={false} // Set to true if these are LCP elements, false otherwise
          />
        </div>
        <CardTitle className="font-headline text-xl">{room.name || 'Unnamed Room'}</CardTitle>
        {room.description && <CardDescription>{room.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" />
          <span>{room.userCount !== undefined ? room.userCount : (room.participantIds?.length || 0)} / {room.capacity || 15} users</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/chat/${room.id}`}>
            <LogIn className="mr-2 h-4 w-4" /> Enter Room
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
