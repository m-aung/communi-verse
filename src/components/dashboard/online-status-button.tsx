
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Power, PowerOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateUserProfile } from '@/lib/services/userService';
import type { UserProfile } from '@/lib/types';

export function OnlineStatusButton() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        setIsLoading(true);
        const user = await getCurrentUser(); // This gets the ChatUser type
        // We need the full UserProfile for isOnline status
        const userProfile = await updateUserProfile(user.id, {}); // Fetch full profile or ensure it exists
        setCurrentUser(userProfile);
      } catch (error) {
        console.error("Failed to fetch current user status:", error);
        toast({ title: "Error", description: "Could not fetch user status.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchCurrentUser();
  }, [toast]);

  const toggleOnlineStatus = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const newStatus = !currentUser.isOnline;
      const updatedProfile = await updateUserProfile(currentUser.id, { isOnline: newStatus });
      if (updatedProfile) {
        setCurrentUser(updatedProfile);
        toast({
          title: `Status Updated`,
          description: `You are now ${updatedProfile.isOnline ? 'Online' : 'Offline'}.`,
          duration: 3000,
        });
      } else {
        throw new Error("Failed to update profile.");
      }
    } catch (error) {
      console.error("Failed to toggle online status:", error);
      toast({ title: "Error", description: "Could not update your status.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !currentUser) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <Button variant="outline" className="w-48 shadow-md" disabled>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
        </Button>
        <p className="text-sm text-muted-foreground">Fetching status...</p>
      </div>
    );
  }

  const isOnline = currentUser?.isOnline || false;

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        onClick={toggleOnlineStatus}
        variant={isOnline ? 'destructive' : 'default'}
        className="w-48 shadow-md"
        disabled={isLoading}
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
