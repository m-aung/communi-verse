
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LogIn, Sparkles, Loader2 } from 'lucide-react';
import type { Room } from '@/lib/types';
import { useState } from 'react';
import { getRoomVibe } from '@/ai/flows/room-vibe-flow'; // Ensure this path is correct
import { useToast } from '@/hooks/use-toast';


interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const imageUrl = room.image || 'https://placehold.co/600x400.png';
  const altText = room.name || 'CommuniVerse room image';
  
  let aiHint = 'social chat'; 
  if (room.name) {
    aiHint = room.name.toLowerCase().split(' ').slice(0, 2).join(' ');
  } else if (room.image?.includes('placehold.co')) {
    aiHint = 'abstract background'; 
  }

  const isValidRoomId = room && typeof room.id === 'string' && room.id.trim() !== '';
  const roomLinkHref = isValidRoomId ? `/chat/${room.id}` : '#';

  const [vibeDescription, setVibeDescription] = useState<string | null>(null);
  const [isVibeLoading, setIsVibeLoading] = useState(false);
  const { toast } = useToast();

  const handleMouseEnter = async () => {
    if (!vibeDescription && !isVibeLoading && room.name) {
      setIsVibeLoading(true);
      try {
        const result = await getRoomVibe({ roomName: room.name });
        setVibeDescription(result.vibe);
      } catch (error) {
        console.error("Error fetching room vibe:", error);
        // Optionally set a default error vibe or do nothing
        // toast({ title: "Vibe Check Failed", description: "Could not generate room vibe.", variant: "destructive" });
      } finally {
        setIsVibeLoading(false);
      }
    }
  };

  if (!isValidRoomId && typeof console !== 'undefined') { 
    console.warn(`RoomCard: Invalid or missing room.id for room object: ${JSON.stringify(room)}. Disabling link.`);
  }

  return (
    <Card 
      className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300"
      onMouseEnter={handleMouseEnter}
    >
      <CardHeader>
        <div className="relative h-40 w-full mb-4 rounded-t-md overflow-hidden">
          <Image
            src={imageUrl}
            alt={altText} 
            fill
            style={{ objectFit: 'cover' }}
            data-ai-hint={aiHint}
            priority={false} 
          />
        </div>
        <CardTitle className="font-headline text-xl">{room.name || 'Unnamed Room'}</CardTitle>
        {room.description && <CardDescription className="text-sm">{room.description}</CardDescription>}
        
        {isVibeLoading && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Checking the vibe...
          </div>
        )}
        {vibeDescription && !isVibeLoading && (
          <p className="text-xs text-accent italic mt-1 flex items-center">
            <Sparkles className="mr-1 h-3 w-3 text-accent" /> {vibeDescription}
          </p>
        )}

      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" />
          <span>{(room as any).userCount !== undefined ? (room as any).userCount : (room.participantIds?.length || 0)} / {room.capacity || 15} users</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          asChild 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
          disabled={!isValidRoomId}
        >
          <Link 
            href={roomLinkHref} 
            aria-disabled={!isValidRoomId} 
            onClick={(e) => { if (!isValidRoomId) e.preventDefault(); }}
          >
            <LogIn className="mr-2 h-4 w-4" /> Enter Room
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
    