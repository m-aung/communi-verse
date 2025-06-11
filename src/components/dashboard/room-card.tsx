
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
  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        {room.image && (
          <div className="relative h-40 w-full mb-4 rounded-t-md overflow-hidden">
            <Image 
              src={room.image} 
              alt={room.name} 
              layout="fill" 
              objectFit="cover" 
              data-ai-hint="abstract room" 
            />
          </div>
        )}
        <CardTitle className="font-headline text-xl">{room.name}</CardTitle>
        {room.description && <CardDescription>{room.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" />
          {/* Assuming room.userCount is available; if not, it should be room.participantIds.length */}
          <span>{room.userCount !== undefined ? room.userCount : (room.participantIds?.length || 0)} / {room.capacity} users</span>
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
