
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, ChatUser, Room, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bell, Gift, Users, Loader2, UserPlus, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { getRoomParticipants, addUserToRoom, removeUserFromRoom } from '@/lib/services/roomService';
import { getChatMessages, addChatMessage } from '@/lib/services/chatService';
import { logGiftSent, logUserFollowed, logUserLeftRoom } from '@/lib/services/telemetryService'; // Import telemetry functions
import { useRouter } from 'next/navigation';

interface ChatClientPageProps {
  room: Room; // Initial room data from server
}

export function ChatClientPage({ room: initialRoom }: ChatClientPageProps) {
  const { user: authUser, loading: authLoading } = useAuth(); // Get current user from AuthContext
  const [room, setRoom] = useState<Room>(initialRoom);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [usersInRoom, setUsersInRoom] = useState<ChatUser[]>([]);
  // currentUser is now authUser from useAuth
  const [isLoading, setIsLoading] = useState(true); // For chat data loading
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchChatData = useCallback(async () => {
    if (!authUser) return; // Wait for authUser to be available
    try {
      setIsLoading(true);
      const [fetchedParticipants, fetchedMessages] = await Promise.all([
        getRoomParticipants(room.id),
        getChatMessages(room.id)
      ]);
      
      const isCurrentUserInList = fetchedParticipants.some(p => p.id === authUser.id);
      if (!isCurrentUserInList) {
        // addUserToRoom expects a UserProfile, but we have ChatUser from auth.
        // For mock, we can pass the ChatUser and roomService can adapt, or we fetch full profile.
        // Let's assume addUserToRoom can handle ChatUser or just needs ID. Our mock uses ID.
        await addUserToRoom(room.id, authUser.id); 
        const updatedParticipants = await getRoomParticipants(room.id);
        setUsersInRoom(updatedParticipants);
        setRoom(prevRoom => ({ ...prevRoom, userCount: updatedParticipants.length }));
      } else {
        setUsersInRoom(fetchedParticipants);
        setRoom(prevRoom => ({ ...prevRoom, userCount: fetchedParticipants.length }));
      }
      setMessages(fetchedMessages);

    } catch (error) {
      console.error("Error fetching chat data:", error);
      toast({ title: "Error", description: "Could not load chat data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [room.id, toast, authUser]);


  useEffect(() => {
    if (authLoading) { // Wait for Firebase auth to resolve
      setIsLoading(true);
      return;
    }
    if (!authUser && !authLoading) { // If auth loaded and no user, redirect
      toast({ title: "Not Authenticated", description: "Please login to join the chat.", variant: "destructive" });
      router.push('/login');
      return;
    }
    // If authUser is available
    if (authUser) {
      fetchChatData();
    }
    
    // Cleanup: remove user from room on unmount or room change
    const currentRoomId = room.id; // Capture room.id at the time of effect setup
    let currentAuthUserId: string | null = null;
    if (authUser) {
      currentAuthUserId = authUser.id;
    }
    
    return () => {
      if (currentAuthUserId) {
        // console.log(`ChatClientPage unmounting/changing room. Removing user ${currentAuthUserId} from ${currentRoomId}`);
        removeUserFromRoom(currentRoomId, currentAuthUserId).then(() => {
            // console.log(`User ${currentAuthUserId} marked as left room ${currentRoomId} after cleanup.`);
            // Log leaving action here as well if user closes tab/navigates away while in room
            // This might be slightly redundant if handleLeaveRoom is also called, but covers more cases.
            // Be mindful of potential double-logging if not handled carefully.
            // For now, primary logging is in handleLeaveRoom for explicit leave.
        }).catch(err => {
            // console.error(`Error removing user ${currentAuthUserId} from room ${currentRoomId} during cleanup:`, err);
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, authUser, authLoading, router]); // fetchChatData is not included to avoid re-triggering on its own change


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !authUser) return;
    try {
      const sentMessage = await addChatMessage(room.id, authUser, newMessage); // Pass ChatUser directly
      setMessages(prevMessages => [...prevMessages, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    }
  };

  const handleRingAction = () => { // Renamed from handleRingFriends
    toast({
      title: 'Followers Ringed!',
      description: `Your followers have been notified to join ${room.name}. (This is a demo)`,
      duration: 3000,
    });
  };

  const handleGiftCoins = (user: ChatUser) => {
    if (!authUser) return;
    toast({
      title: 'Coins Gifted!',
      description: `You gifted coins to ${user.name}. (This is a demo)`,
      duration: 3000,
    });
    logGiftSent(authUser.id, user.id, room.id);
  };

  const handleFollowUser = (user: ChatUser) => {
    if (!authUser) return;
    toast({
      title: 'Followed User!',
      description: `You are now following ${user.name}. (This is a demo)`,
      duration: 3000,
    });
    logUserFollowed(authUser.id, user.id, room.id);
  };

  const handleLeaveRoom = async () => {
    if (!authUser) return;
    try {
      await removeUserFromRoom(room.id, authUser.id);
      logUserLeftRoom(authUser.id, room.id); // Log leaving action
      toast({
        title: 'Left Room',
        description: `You have left ${room.name}.`,
      });
      router.push('/');
    } catch (error) {
      console.error("Error leaving room:", error);
      toast({ title: "Error", description: "Could not leave room.", variant: "destructive" });
    }
  };

  if (isLoading || authLoading || !authUser && !authLoading ) { // Show loader if chat data or auth is loading, or if no user after auth check
    return (
      <div className="flex justify-center items-center h-[calc(100vh-180px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading chat...</p>
      </div>
    );
  }
  
  // This check should ideally be covered by useEffect redirect, but as a safeguard for render
  if (!authUser) {
      return <p className="text-center py-10">Redirecting to login...</p>;
  }


  return (
    <div className="flex flex-1 flex-col lg:flex-row gap-6">
      <Card className="flex flex-col max-h-[40vh] lg:max-h-full lg:w-1/4 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Users className="mr-2 h-5 w-5" /> Participants ({room.userCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 pt-0 overflow-hidden">
          <ScrollArea className="flex-1 pr-3">
            {usersInRoom.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-4">The room is empty.</p>
            )}
            {usersInRoom.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 mb-2 rounded-md hover:bg-muted">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{user.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name} {user.id === authUser?.id ? "(You)" : ""}</span>
                </div>
                {user.id !== authUser?.id && (
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleFollowUser(user)} title={`Follow ${user.name}`}>
                      <UserPlus className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleGiftCoins(user)} title={`Gift coins to ${user.name}`}>
                      <Gift className="h-4 w-4 text-yellow-500" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
          <div className="mt-4 space-y-2 shrink-0">
            {usersInRoom.length <= 1 && authUser && !usersInRoom.find(u => u.id !== authUser.id) && ( // Show if only current user is in room
              <Button onClick={handleRingAction} variant="outline" className="w-full">
                <Bell className="mr-2 h-4 w-4" /> Ring Followers
              </Button>
            )}
            <Button onClick={handleLeaveRoom} variant="destructive" className="w-full">
              <LogOut className="mr-2 h-4 w-4" /> Leave Room
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-xl">{room.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messages.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground py-4">No messages yet. Be the first to say something!</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-3 ${msg.sender.id === authUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end max-w-[70%] ${msg.sender.id === authUser?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                   <Avatar className="h-8 w-8 mx-2 order-1">
                    <AvatarImage src={msg.sender.avatarUrl} alt={msg.sender.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{msg.sender.name.substring(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`p-3 rounded-lg shadow ${
                      msg.sender.id === authUser?.id
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-foreground rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm font-medium mb-0.5">{msg.sender.name}</p>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="border-t p-4 bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
                disabled={isLoading || authLoading}
              />
              <Button type="submit" variant="default" disabled={isLoading || authLoading || newMessage.trim() === ''}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
