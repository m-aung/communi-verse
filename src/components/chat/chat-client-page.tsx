
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, ChatUser, Room } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bell, Gift, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/services/userService';
import { getRoomParticipants, addUserToRoom, removeUserFromRoom } from '@/lib/services/roomService';
import { getChatMessages, addChatMessage } from '@/lib/services/chatService';

interface ChatClientPageProps {
  room: Room; // Initial room data from server
}

export function ChatClientPage({ room: initialRoom }: ChatClientPageProps) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [usersInRoom, setUsersInRoom] = useState<ChatUser[]>([]);
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchChatData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const [fetchedParticipants, fetchedMessages] = await Promise.all([
        getRoomParticipants(room.id),
        getChatMessages(room.id)
      ]);
      
      // Ensure current user is part of the room's participant list if not already
      // This simulates "joining" the room on the backend if not already there
      const isCurrentUserInList = fetchedParticipants.some(p => p.id === currentUser.id);
      if (!isCurrentUserInList) {
        await addUserToRoom(room.id, currentUser.id);
        // Re-fetch participants to include current user
        const updatedParticipants = await getRoomParticipants(room.id);
        setUsersInRoom(updatedParticipants);
         // Update room user count
        setRoom(prevRoom => ({ ...prevRoom, userCount: updatedParticipants.length }));
      } else {
        setUsersInRoom(fetchedParticipants);
         // Update room user count
        setRoom(prevRoom => ({ ...prevRoom, userCount: fetchedParticipants.length }));
      }
      setMessages(fetchedMessages);

    } catch (error) {
      console.error("Error fetching chat data:", error);
      toast({ title: "Error", description: "Could not load chat data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [room.id, toast, currentUser]);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);
  
  useEffect(() => {
    if (currentUser) {
      fetchChatData();
    }
    // Simulating user leaving the room on component unmount or room change
    // In a real app, this would be handled more robustly (e.g. WebSocket disconnect, window beforeunload)
    const currentRoomId = room.id;
    return () => {
      if (currentUser) {
        removeUserFromRoom(currentRoomId, currentUser.id).then(() => {
            // console.log(`User ${currentUser.id} marked as left room ${currentRoomId}`);
        });
      }
    };

  }, [room.id, fetchChatData, currentUser]);


  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !currentUser) return;
    try {
      const sentMessage = await addChatMessage(room.id, currentUser, newMessage);
      setMessages(prevMessages => [...prevMessages, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    }
  };

  const handleRingFriends = () => {
    toast({
      title: 'Friends Ringed!',
      description: `Your friends have been notified to join ${room.name}. (This is a demo)`,
      duration: 3000,
    });
  };

  const handleGiftCoins = (user: ChatUser) => {
    toast({
      title: 'Coins Gifted!',
      description: `You gifted coins to ${user.name}. (This is a demo)`,
      duration: 3000,
    });
  };

  if (isLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-180px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] max-h-[800px]">
      <Card className="lg:w-1/4 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Users className="mr-2 h-5 w-5" /> Participants ({room.userCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-300px)] lg:h-auto max-h-[650px] pr-3">
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
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                {user.id !== currentUser.id && (
                  <Button variant="ghost" size="sm" onClick={() => handleGiftCoins(user)} title={`Gift coins to ${user.name}`}>
                    <Gift className="h-4 w-4 text-yellow-500" />
                  </Button>
                )}
              </div>
            ))}
          </ScrollArea>
          {usersInRoom.length <= 1 && (
            <Button onClick={handleRingFriends} variant="outline" className="w-full mt-4">
              <Bell className="mr-2 h-4 w-4" /> Ring Friends
            </Button>
          )}
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
                className={`flex mb-3 ${msg.sender.id === currentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end max-w-[70%] ${msg.sender.id === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
                   <Avatar className="h-8 w-8 mx-2 order-1">
                    <AvatarImage src={msg.sender.avatarUrl} alt={msg.sender.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{msg.sender.name.substring(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`p-3 rounded-lg shadow ${
                      msg.sender.id === currentUser.id
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
                disabled={isLoading}
              />
              <Button type="submit" variant="default" disabled={isLoading || newMessage.trim() === ''}>
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
