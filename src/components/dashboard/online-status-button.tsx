
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Power, PowerOff, Loader2, LogIn as LogInIcon } from 'lucide-react'; // Renamed LogIn to avoid conflict
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; 
import { updateUserProfile } from '@/lib/services/userService';
// UserProfile type no longer needed here as it comes from context
import { useRouter } from 'next/navigation';


export function OnlineStatusButton() {
  // userProfile now comes from useAuth context, loading also from context
  const { userProfile, loading: authLoading, firebaseUser } = useAuth(); 
  const [isTogglingStatus, setIsTogglingStatus] = useState(false); // Local loading state for the toggle action
  const { toast } = useToast();
  const router = useRouter();

  const toggleOnlineStatus = async () => {
    if (!firebaseUser) { // Check firebaseUser for auth status before action
      toast({ title: "Not Authenticated", description: "Please login.", variant: "destructive" });
      return;
    }

    if (!userProfile) { // Profile might still be loading from context, or genuinely null
      toast({ 
        title: "Profile Not Ready", 
        description: "Your profile information is still loading or not found. Please try again in a moment.", 
        variant: "default"
      });
      return;
    }
    
    setIsTogglingStatus(true); 
    try {
      const currentIsOnline = userProfile.isOnline || false;
      const newStatus = !currentIsOnline;
      
      // Only update in Firestore. Context will update via listener in AuthProvider.
      const updateSucceeded = await updateUserProfile(firebaseUser?.uid, { isOnline: newStatus });
      
      if (updateSucceeded) {
        // The AuthProvider's listener will update the context and UI.
        toast({
          title: `Status Updated`,
          description: `You are now ${newStatus ? 'Online' : 'Offline'}.`,
          duration: 3000,
        });
      } else {
        // No need for the specific console.error here anymore, toast is sufficient
        toast({
          title: "Update Failed",
          description: "Could not update your online status in the database. Please try again.",
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
      setIsTogglingStatus(false);
    }
  };
  
  // authLoading covers initial Firebase auth and profile listener setup.
  // isTogglingStatus covers the direct action of this button.
  if (authLoading) { 
    return (
      <div className="flex flex-col items-center space-y-2">
        <Button variant="outline" className="w-48 shadow-md" disabled>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Status...
        </Button>
        <p className="text-sm text-muted-foreground">Fetching status...</p>
      </div>
    );
  }
  
  if (!firebaseUser) { // User not authenticated
    return (
        <div className="flex flex-col items-center space-y-2">
            <p className="text-muted-foreground">Please log in to manage your status.</p>
            <Button variant="default" onClick={() => router.push('/login')}>
              <LogInIcon className="mr-2 h-4 w-4" /> Login
            </Button>
        </div>
    );
  }

  // If firebaseUser exists, but userProfile is null (e.g., error in listener or profile deletion)
  if (!userProfile && !authLoading) {
      return (
          <div className="flex flex-col items-center space-y-2">
              <p className="text-destructive">Could not load your profile information.</p>
              <Button variant="outline" className="w-48 shadow-md" disabled>
                  Status Unavailable
              </Button>
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
        disabled={isTogglingStatus} // Disable only while this button's action is in progress
      >
        {isTogglingStatus ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : isOnline ? (
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

