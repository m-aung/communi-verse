
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LogIn, Sparkles, Loader2, Diamond, Coins } from 'lucide-react';
import type { Room } from '@/lib/types';
import { useState } from 'react';
import { getRoomVibe } from '@/ai/flows/room-vibe-flow';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; 
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


interface RoomCardProps {
  room: Room & { userCount: number }; // Corrected type
}

export function RoomCard({ room }: RoomCardProps) {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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
  const [showPremiumEntryDialog, setShowPremiumEntryDialog] = useState(false);

  const handleMouseEnter = async () => {
    if (!vibeDescription && !isVibeLoading && room.name) {
      setIsVibeLoading(true);
      try {
        const result = await getRoomVibe({ roomName: room.name });
        setVibeDescription(result.vibe);
      } catch (error) {
        console.error("Error fetching room vibe:", error);
        // Optionally set a fallback or error message for vibeDescription
        // setVibeDescription("Could not fetch vibe...");
      } finally {
        setIsVibeLoading(false);
      }
    }
  };

  const handleEnterRoomClick = (e: React.MouseEvent) => {
    if (!isValidRoomId) {
      e.preventDefault();
      toast({
        title: "Room Unavailable",
        description: "This room ID is invalid or missing. Cannot enter.",
        variant: "destructive",
      });
      return;
    }
    if (room.admissionFee && room.admissionFee > 0) {
      e.preventDefault(); // Prevent direct navigation
      if (!authUser) {
        toast({
          title: "Authentication Required",
          description: "Please log in to enter premium rooms.",
          variant: "destructive",
          action: <Button onClick={() => router.push('/login')}>Login</Button>,
        });
        return;
      }
      setShowPremiumEntryDialog(true);
    }
    // For free rooms, the Link component will handle navigation if asChild is true
  };

  const handleConfirmPremiumEntry = () => {
    // TODO: Implement actual coin check and deduction with userService
    // For now, simulate successful entry
    if (!authUser) { // Should not happen if button is enabled correctly, but good check
        toast({ title: "Error", description: "User not authenticated.", variant: "destructive"});
        setShowPremiumEntryDialog(false);
        return;
    }
    const hasEnoughCoins = true; // Simulate user having enough coins

    if (hasEnoughCoins) {
      toast({
        title: "Entry Confirmed",
        description: `Welcome to ${room.name}! ${room.admissionFee} coins deducted. (Simulated)`,
      });
      // userService.deductCoins(authUser.id, room.admissionFee); // Future implementation
      setShowPremiumEntryDialog(false);
      if (isValidRoomId) {
        router.push(roomLinkHref);
      }
    } else {
      toast({
        title: "Insufficient Coins",
        description: `You need ${room.admissionFee} coins to enter ${room.name}. Visit the store to buy more.`,
        variant: "destructive",
        action: <Button onClick={() => router.push('/store')}>Go to Store</Button>,
      });
      setShowPremiumEntryDialog(false);
    }
  };


  if (!isValidRoomId && typeof console !== 'undefined') { 
    console.warn(`RoomCard: Invalid or missing room.id for room object: ${JSON.stringify(room)}. Disabling link and actions.`);
  }

  return (
    <>
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
            {room.admissionFee && room.admissionFee > 0 && (
              <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center shadow-lg">
                <Diamond className="mr-1 h-3 w-3" /> Premium
              </div>
            )}
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
            <span>{room.userCount} / {room.capacity || 15} users</span>
          </div>
          {room.admissionFee && room.admissionFee > 0 && (
            <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 mt-2 font-semibold">
              <Coins className="mr-1 h-4 w-4" />
              <span>{room.admissionFee} Coins to Enter</span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleEnterRoomClick}
            asChild={!(room.admissionFee && room.admissionFee > 0) && isValidRoomId} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
            disabled={!isValidRoomId}
          >
            { (room.admissionFee && room.admissionFee > 0) ? (
              <>
                <Diamond className="mr-2 h-4 w-4" /> Enter Premium Room
              </>
            ) : (
              isValidRoomId ? (
                <Link 
                  href={roomLinkHref} 
                  aria-disabled={!isValidRoomId}
                >
                  <LogIn className="mr-2 h-4 w-4" /> Enter Room
                </Link>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Enter Room
                </>
              )
            )}
          </Button>
        </CardFooter>
      </Card>

      {room.admissionFee && room.admissionFee > 0 && (
        <AlertDialog open={showPremiumEntryDialog} onOpenChange={setShowPremiumEntryDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enter Premium Room: {room.name || 'Unnamed Room'}?</AlertDialogTitle>
              <AlertDialogDescription>
                This room requires an admission fee of <strong className="text-foreground">{room.admissionFee} coins</strong>.
                Do you want to spend {room.admissionFee} coins to enter? (Coin balance check is simulated)
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmPremiumEntry} disabled={!authUser}>
                Enter ({room.admissionFee} Coins)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
