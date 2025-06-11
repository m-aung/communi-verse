
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Power, PowerOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { getUserProfile, updateUserProfile } from '@/lib/services/userService';
import type { UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';


export function OnlineStatusButton() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Local loading for fetching this component's specific data
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) {
      // If auth is globally loading, this component is also in a loading state.
      // We don't need to fetch profile yet.
      setIsLoading(true);
      return;
    }

    // Auth is resolved (authLoading is false)
    if (!authUser) {
      // No authenticated user, so no profile to fetch or manage here.
      setIsLoading(false);
      setUserProfile(null);
      return;
    }

    // Authenticated user is present, and global auth loading is false.
    // Fetch the specific UserProfile for this component.
    async function fetchCurrentUserProfile() {
      setIsLoading(true); // Start local loading for this specific fetch
      try {
        const profile = await getUserProfile(authUser.id);
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to fetch current user profile for status:", error);
        // Optionally, toast an error message to the user
        // toast({ title: "Error", description: "Could not load profile details.", variant: "destructive" });
      } finally {
        setIsLoading(false); // Finish local loading
      }
    }
    fetchCurrentUserProfile();
  }, [authUser, authLoading]); // Dependencies: effect runs if authUser or authLoading changes.

  const toggleOnlineStatus = async () => {
    if (!authUser) {
      toast({ title: "Not Authenticated", description: "Please login.", variant: "destructive" });
      return;
    }
    setIsLoading(true); // Use local isLoading for the toggle action itself
    try {
      const currentIsOnline = userProfile ? userProfile.isOnline : false;
      const newStatus = !currentIsOnline;

      let profileToUpdate = userProfile;
      if (!profileToUpdate) {
         profileToUpdate = {
            id: authUser.id,
            name: authUser.name, // Name from authUser might be basic initially
            email: '', // userService should ideally get this from FirebaseUser if needed
            avatarUrl: authUser.avatarUrl,
            isOnline: newStatus, 
            bio: '',
         };
      } else {
        profileToUpdate = { ...profileToUpdate, isOnline: newStatus };
      }
      
      // Pass only the part to update, or the full profile if creating.
      // userService's updateUserProfile should handle if it needs to create.
      const updatedProfile = await updateUserProfile(authUser.id, { isOnline: newStatus });
      
      if (updatedProfile) {
        setUserProfile(updatedProfile);
        toast({
          title: `Status Updated`,
          description: `You are now ${updatedProfile.isOnline ? 'Online' : 'Offline'}.`,
          duration: 3000,
        });
      } else {
        throw new Error("Failed to update profile status. Profile might not exist or update failed.");
      }
    } catch (error) {
      console.error("Failed to toggle online status:", error);
      toast({ title: "Error", description: "Could not update your status.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Display loading UI if either global auth is loading or this component is fetching its profile
  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <Button variant="outline" className="w-48 shadow-md" disabled>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Status...
        </Button>
        <p className="text-sm text-muted-foreground">Fetching status...</p>
      </div>
    );
  }
  
  // If auth is resolved, and no user is authenticated
  if (!authUser && !authLoading) {
    return (
        <div className="flex flex-col items-center space-y-2">
            <p className="text-muted-foreground">Please log in to manage your status.</p>
            <Button variant="default" onClick={() => router.push('/login')}>Login</Button>
        </div>
    );
  }

  // At this point, authUser is available, authLoading is false, and local isLoading is false.
  const isOnline = userProfile?.isOnline || false;

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        onClick={toggleOnlineStatus}
        variant={isOnline ? 'destructive' : 'default'}
        className="w-48 shadow-md"
        // Disable button only if an action (like toggling) is in progress locally (covered by setIsLoading(true) in toggleOnlineStatus)
        // The outer (authLoading || isLoading) check handles initial loading.
      >
        {/* The Loader2 here is more for the toggle action, but the outer one handles initial load */}
        {isOnline ? (
          <>
            <PowerOff className="mr-2 h-5 w-5" /> Go Offline
          </>
        ) : (
          <>
            <Power className="mr-2 h-5 w-5" /> Go Online
          </>
        )}
      </Button>
      <p className="text-sm text-muted-foreground">
        You are currently: <span className={isOnline ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{isOnline ? 'Online' : 'Offline'}</span>
      </p>
    </div>
  );
}
