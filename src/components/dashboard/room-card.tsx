
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LogIn, Sparkles, Loader2, Diamond, Coins } from 'lucide-react';
import type { Room, UserProfile } from '@/lib/types'; // UserProfile is now for context
import { useState, useEffect } from 'react';
import { getRoomVibe } from '@/ai/flows/room-vibe-flow';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; // Using enhanced useAuth
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
} from "@/components/ui/alert-dialog";
// No longer need getUserProfile here as it comes from useAuth

interface RoomCardProps {
  room: Room & { userCount: number };
}

export function RoomCard({ room }: RoomCardProps) {
  // Get userProfile and authLoading from useAuth context
  const { userProfile, loading: authLoading, firebaseUser } = useAuth(); 
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

  // isUserOnline is now derived from context's userProfile
  const isUserOnline = !!userProfile?.isOnline;

  const handleMouseEnter = async () => {
    if (!vibeDescription && !isVibeLoading && room.name) {
      setIsVibeLoading(true);
      try {
        const result = await getRoomVibe({ roomName: room.name });
        setVibeDescription(result.vibe);
      } catch (error) {
        console.error("Error fetching room vibe:", error);
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

    if (authLoading) { // Check if auth context is still loading
        toast({
            title: "Loading Status",
            description: "Please wait while we check your authentication status.",
        });
        return;
    }
    
    if (!firebaseUser) { // Check if user is authenticated via firebaseUser from context
      if (room.admissionFee && room.admissionFee > 0) {
        setShowPremiumEntryDialog(true); 
      } else {
        toast({
          title: "Login Required",
          description: "Please log in to enter this room.",
          variant: "default", // Changed from destructive to default as it's a common action
          action: <Button onClick={() => router.push('/login')}>Login</Button>,
        });
      }
      return; // Stop further execution if not authenticated or if auth is loading
    }

    // User is authenticated (firebaseUser exists), now check online status from userProfile
    // userProfile might still be null if listener hasn't populated it yet, covered by authLoading check above.
    // If !authLoading and firebaseUser exists, userProfile should ideally be available.
    // However, if userProfile is null even after authLoading is false (e.g. Firestore error for profile), treat as offline.
    if (!isUserOnline) {
      toast({
        title: "You are Offline",
        description: "Please go online from the dashboard to enter rooms.",
        variant: "destructive",
      });
      return;
    }

    // User is authenticated and online
    if (room.admissionFee && room.admissionFee > 0) {
      setShowPremiumEntryDialog(true);
    } else {
      router.push(roomLinkHref);
    }
  };

  const handleConfirmPremiumEntry = () => {
    // userProfile and isUserOnline are from context and re-checked by button's disabled state
    // firebaseUser check is also implicitly handled by the dialog's action button disabled state
    
    const hasEnoughCoins = true; // Simulate

    if (hasEnoughCoins) {
      toast({
        title: "Entry Confirmed",
        description: `Welcome to ${room.name}! ${room.admissionFee} coins deducted. (Simulated)`,
      });
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

  const isPremiumRoom = room.admissionFee !== undefined && room.admissionFee > 0;

  // Button disabled logic updated to use authLoading and isUserOnline from context
  const buttonDisabled = 
    !isValidRoomId || 
    authLoading || // Disabled if auth/profile is loading
    (!!firebaseUser && !isUserOnline) || // Disabled if authenticated but offline
    (!firebaseUser && !isPremiumRoom); // Disabled for free rooms if not authenticated. Premium handles via dialog.

  const alertDialogActionDisabled = 
    authLoading || 
    !firebaseUser || 
    (!!firebaseUser && !isUserOnline);


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
            {isPremiumRoom && (
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
          {isPremiumRoom && (
            <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 mt-2 font-semibold">
              <Coins className="mr-1 h-4 w-4" />
              <span>{room.admissionFee} Coins to Enter</span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleEnterRoomClick}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
            disabled={buttonDisabled}
          >
            {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPremiumRoom ? (
              <>
                <Diamond className="mr-2 h-4 w-4" /> Enter Premium Room
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Enter Room
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {isPremiumRoom && (
        <AlertDialog open={showPremiumEntryDialog} onOpenChange={setShowPremiumEntryDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enter Premium Room: {room.name || 'Unnamed Room'}?</AlertDialogTitle>
              <AlertDialogDescription>
                This room requires an admission fee of <strong className="text-foreground">{room.admissionFee} coins</strong>.
                Do you want to spend {room.admissionFee} coins to enter? (Coin balance check is simulated)
                {!isUserOnline && firebaseUser && <p className="mt-2 text-destructive-foreground bg-destructive p-2 rounded-md">You must be online to enter.</p>}
                {!firebaseUser && <p className="mt-2 text-destructive-foreground bg-destructive p-2 rounded-md">Please log in to enter.</p>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmPremiumEntry} 
                disabled={alertDialogActionDisabled}
              >
                {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enter ({room.admissionFee} Coins)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
