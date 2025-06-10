"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Power, PowerOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function OnlineStatusButton() {
  const [isOnline, setIsOnline] = useState(false);
  const { toast } = useToast();

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast({
      title: `Status Updated`,
      description: `You are now ${!isOnline ? 'Online' : 'Offline'}.`,
      duration: 3000,
    });
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        onClick={toggleOnlineStatus}
        variant={isOnline ? 'destructive' : 'default'}
        className="w-48 shadow-md"
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
