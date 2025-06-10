
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
  const [isLoading, setIsLoading] = useState(true); // For local loading state (fetching profile, updating status)
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) { // Wait for Firebase auth to resolve
      setIsLoading(true);
      return;
    }
    if (!authUser) { // If not authenticated, no profile to manage here
      setIsLoading(false);
      setUserProfile(null);
      // Optionally, redirect or show a message if this component shouldn't be visible
      // router.push('/login'); 
      return;
    }

    async function fetchCurrentUserProfile() {
      setIsLoading(true);
      try {
        // authUser.id is the Firebase UID
        const profile = await getUserProfile(authUser.id);
        setUserProfile(profile); // This can be null if no extended profile exists yet
                                // The toggle function should handle profile creation/update gracefully
      } catch (error) {
        console.error("Failed to fetch current user profile for status:", error);
        // Don't toast here, as it might be too noisy if profile doesn't exist yet
      } finally {
        setIsLoading(false);
      }
    }
    fetchCurrentUserProfile();
  }, [authUser, authLoading, toast]);

  const toggleOnlineStatus = async () => {
    if (!authUser) {
      toast({ title: "Not Authenticated", description: "Please login.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      // If userProfile doesn't exist from the fetch, we use authUser to ensure we have an ID and base details
      const currentIsOnline = userProfile ? userProfile.isOnline : false; // Assume offline if no profile
      const newStatus = !currentIsOnline;

      // Ensure a profile exists or create one when toggling status
      let profileToUpdate = userProfile;
      if (!profileToUpdate) {
         profileToUpdate = {
            id: authUser.id,
            name: authUser.name,
            email: authUser.email || '', // email might not be on ChatUser from useAuth initially
            avatarUrl: authUser.avatarUrl,
            isOnline: newStatus, // Set directly
            bio: '',
         };
      } else {
        profileToUpdate = { ...profileToUpdate, isOnline: newStatus };
      }
      
      const updatedProfile = await updateUserProfile(authUser.id, { isOnline: newStatus });
      
      if (updatedProfile) {
        setUserProfile(updatedProfile);
        toast({
          title: `Status Updated`,
          description: `You are now ${updatedProfile.isOnline ? 'Online' : 'Offline'}.`,
          duration: 3000,
        });
      } else {
         // This could happen if the profile didn't exist and updateUserProfile can't create.
         // Our mock updateUserProfile should handle creation via createUserProfile logic if an ID is passed.
        throw new Error("Failed to update profile status. Profile might not exist.");
      }
    } catch (error) {
      console.error("Failed to toggle online status:", error);
      toast({ title: "Error", description: "Could not update your status.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <Button variant="outline" className="w-48 shadow-md" disabled>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Status...
        </Button>
        <p className="text-sm text-muted-foreground">Fetching status...</p>
      </div>
    );
  }
  
  if (!authUser && !authLoading) { // If done loading and no authUser
    return (
        <div className="flex flex-col items-center space-y-2">
            <p className="text-muted-foreground">Please log in to manage your status.</p>
            <Button variant="default" onClick={() => router.push('/login')}>Login</Button>
        </div>
    );
  }


  const isOnline = userProfile?.isOnline || false; // Default to false if no profile or isOnline is undefined

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        onClick={toggleOnlineStatus}
        variant={isOnline ? 'destructive' : 'default'}
        className="w-48 shadow-md"
        disabled={isLoading} // Local loading for the toggle action itself
      >
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
          isOnline ? (
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
