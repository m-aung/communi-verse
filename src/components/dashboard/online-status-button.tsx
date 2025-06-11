
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Power, PowerOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; 
import { getUserProfile, updateUserProfile } from '@/lib/services/userService';
import type { UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';


export function OnlineStatusButton() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!authUser) {
      setIsLoading(false);
      setUserProfile(null);
      return;
    }

    async function fetchCurrentUserProfile() {
      setIsLoading(true); 
      try {
        const profile = await getUserProfile(authUser.id);
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to fetch current user profile for status:", error);
      } finally {
        setIsLoading(false); 
      }
    }
    fetchCurrentUserProfile();
  }, [authUser, authLoading]); 

  const toggleOnlineStatus = async () => {
    if (!authUser) {
      toast({ title: "Not Authenticated", description: "Please login.", variant: "destructive" });
      return;
    }

    // Guard against operating if the component's local userProfile state is not yet loaded.
    if (!userProfile) {
      toast({ 
        title: "Profile Not Ready", 
        description: "Your profile information is still loading. Please try again in a moment.", 
        variant: "default" // Changed to default or "destructive" if preferred
      });
      // No need to setIsSubmitting(true) if we are returning early.
      return;
    }
    
    setIsLoading(true); 
    try {
      const currentIsOnline = userProfile.isOnline || false; // userProfile is guaranteed to be non-null here
      const newStatus = !currentIsOnline;
      
      const updatedProfile = await updateUserProfile(authUser.id, { isOnline: newStatus });
      
      if (updatedProfile) {
        setUserProfile(updatedProfile);
        toast({
          title: `Status Updated`,
          description: `You are now ${updatedProfile.isOnline ? 'Online' : 'Offline'}.`,
          duration: 3000,
        });
      } else {
        // This case means updateUserProfile returned null.
        // This could happen if the profile document didn't exist (which our guard above tries to prevent by checking local state)
        // or if the update operation itself failed at the service layer for other reasons.
        console.error("OnlineStatusButton: updateUserProfile returned null. This might indicate the profile doesn't exist in DB or the update failed.");
        toast({
          title: "Update Failed",
          description: "Could not update your online status. Please ensure your profile is fully set up or try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to toggle online status:", error);
      toast({
        title: "Error Toggling Status",
        description: error.message || "An unexpected error occurred while updating your status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  if (!authUser && !authLoading) {
    return (
        <div className="flex flex-col items-center space-y-2">
            <p className="text-muted-foreground">Please log in to manage your status.</p>
            <Button variant="default" onClick={() => router.push('/login')}>Login</Button>
        </div>
    );
  }

  const isOnline = userProfile?.isOnline || false;

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        onClick={toggleOnlineStatus}
        variant={isOnline ? 'destructive' : 'default'}
        className="w-48 shadow-md"
        // Button is disabled by isLoading (local) if an action is in progress
        // or by the outer (authLoading || isLoading) check during initial load.
      >
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
