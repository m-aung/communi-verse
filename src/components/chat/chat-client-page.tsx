
"use client";

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, ChatUser, Room, UserProfile } from '@/lib/types'; // UserProfile needed for authUser
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bell, Gift, Users, Loader2, UserPlus, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  addUserToRoom,
  removeUserFromRoom,
} from '@/lib/services/roomService';
import { getUserProfile } from '@/lib/services/userService';
import { addChatMessage } from '@/lib/services/chatService'; 
import { logGiftSent, logUserFollowed, logUserLeftRoom } from '@/lib/services/telemetryService';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy, type Timestamp, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

interface ChatClientPageProps {
  room: Room;
}

export function ChatClientPage({ room: initialRoom }: ChatClientPageProps) {
  const { userProfile: authUserProfile, loading: authLoading, firebaseUser } = useAuth(); // Use userProfile
  const [room, setRoom] = useState<Room>(initialRoom);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [usersInRoom, setUsersInRoom] = useState<ChatUser[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true); // Renamed from isLoading for clarity
  const [isRefreshingParticipants, setIsRefreshingParticipants] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const unsubscribeParticipantsRef = useRef<Unsubscribe | null>(null);
  const unsubscribeMessagesRef = useRef<Unsubscribe | null>(null);

  // Effect for handling auth state and setting up listeners
  useEffect(() => {
    if (authLoading) {
      setIsLoadingPage(true);
      return;
    }
    if (!firebaseUser && !authLoading) { // Check firebaseUser for authentication
      toast({ title: "Not Authenticated", description: "Please login to join the chat.", variant: "destructive" });
      router.push('/login');
      setIsLoadingPage(false);
      return;
    }

    // firebaseUser exists, proceed
    if (firebaseUser && room.id && authUserProfile) { // Ensure authUserProfile is also available
      setIsLoadingPage(true); // Keep true until first participant snapshot
      setIsLoadingMessages(true);

      addUserToRoom(room.id, firebaseUser?.uid)
        .catch(error => {
          console.error("Error ensuring user is in room:", error);
          toast({ title: "Entry Error", description: "Could not ensure your presence in the room.", variant: "destructive" });
        });

      // Listener for Participants
      const roomDocRef = doc(db, 'rooms', room.id);
      unsubscribeParticipantsRef.current = onSnapshot(roomDocRef, async (docSnap) => {
        setIsRefreshingParticipants(true);
        if (docSnap.exists()) {
          const roomData = docSnap.data();
          const participantIds: string[] = roomData.participantIds || [];

          setRoom(prevRoom => ({ ...prevRoom, name: roomData.name, description: roomData.description, capacity: roomData.capacity, image: roomData.image, userCount: participantIds.length }));

          if (participantIds.length === 0) {
            setUsersInRoom([]);
          } else {
            try {
              const participantsPromises = participantIds.map(async (userId) => {
                const profile = await getUserProfile(userId); // This is userService.getUserProfile
                return profile ? { id: profile.id, name: profile.name, avatarUrl: profile.avatarUrl } as ChatUser : null;
              });
              const resolvedParticipants = (await Promise.all(participantsPromises)).filter(
                (p): p is ChatUser => p !== null
              );
              setUsersInRoom(resolvedParticipants);
            } catch (profileError) {
              console.error("Error fetching participant profiles:", profileError);
              // toast({ title: "Profile Error", description: "Could not load all participant details.", variant: "destructive" });
            }
          }
        } else {
          console.warn(`Room ${room.id} not found while listening for participants.`);
          setUsersInRoom([]);
          setRoom(prevRoom => ({ ...prevRoom, userCount: 0 }));
          toast({ title: "Room Error", description: "The chat room may no longer exist.", variant: "destructive" });
          router.push('/');
        }
        setIsRefreshingParticipants(false);
        setIsLoadingPage(false); 
      }, (error) => {
        console.error(`Error listening to room participants for room ${room.id}:`, error);
        toast({ title: "Real-time Error", description: "Could not connect to real-time participant updates.", variant: "destructive" });
        setIsRefreshingParticipants(false);
        setIsLoadingPage(false);
      });

      // Listener for Messages
      const messagesCollectionRef = collection(db, 'rooms', room.id, 'messages');
      const qMessages = query(messagesCollectionRef, orderBy('timestamp', 'asc'));
      unsubscribeMessagesRef.current = onSnapshot(qMessages, (querySnapshot) => {
        const fetchedMessages = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          // Ensure sender structure matches ChatUser
          const senderData = data.sender as any; // Cast to any for temp access
          const sender: ChatUser = {
            id: senderData?.id || 'unknown',
            name: senderData?.name || 'Unknown User',
            avatarUrl: senderData?.avatarUrl
          };
          return {
            id: docSnap.id,
            roomId: room.id,
            sender: sender,
            text: data.text,
            timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
          } as ChatMessage;
        });
        setMessages(fetchedMessages);
        setIsLoadingMessages(false);
      }, (error) => {
        console.error(`Error listening to messages for room ${room.id}:`, error);
        toast({ title: "Message Error", description: "Could not load real-time messages.", variant: "destructive" });
        setIsLoadingMessages(false);
      });
    } else if (!authLoading && (!firebaseUser || !authUserProfile)) {
      // Handles case where auth is loaded, but user is not authenticated or profile is missing
      setIsLoadingPage(false);
      if (!firebaseUser) router.push('/login');
      else if (!authUserProfile) toast({ title: "Profile Error", description: "Your profile could not be loaded.", variant: "destructive" });
    }


    const currentRoomId = room.id;
    const currentAuthUserId: string | null = firebaseUser ? firebaseUser?.uid : null;

    return () => {
      if (unsubscribeParticipantsRef.current) {
        unsubscribeParticipantsRef.current();
      }
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
      }
      if (currentAuthUserId && currentRoomId) {
        removeUserFromRoom(currentRoomId, currentAuthUserId).catch(err => {
           console.warn(`Attempted to remove user ${currentAuthUserId} from room ${currentRoomId} during cleanup, might fail if room/user already gone:`, err.message);
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, firebaseUser, authLoading, authUserProfile]); // Added authUserProfile


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !firebaseUser || !authUserProfile) return; // Check authUserProfile
    try {
      const senderForMessage: ChatUser = { // Construct ChatUser from UserProfile
          id: authUserProfile.id,
          name: authUserProfile.name,
          avatarUrl: authUserProfile.avatarUrl
      };
      await addChatMessage(room.id, senderForMessage, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    }
  };

  const handleRingAction = () => {
    toast({
      title: 'Followers Ringed!',
      description: `Your followers have been notified to join ${room.name}. (This is a demo)`,
      duration: 3000,
    });
  };

  const handleGiftCoins = (user: ChatUser) => {
    if (!firebaseUser) return; // Check firebaseUser
    toast({
      title: 'Coins Gifted!',
      description: `You gifted coins to ${user.name}. (This is a demo)`,
      duration: 3000,
    });
    logGiftSent(firebaseUser?.uid, user.id, room.id);
  };

  const handleFollowUser = (user: ChatUser) => {
    if (!firebaseUser) return; // Check firebaseUser
    toast({
      title: 'Followed User!',
      description: `You are now following ${user.name}. (This is a demo)`,
      duration: 3000,
    });
    logUserFollowed(firebaseUser?.uid, user.id, room.id);
  };

  const handleLeaveRoom = async () => {
    if (!firebaseUser) return; // Check firebaseUser
    try {
      await removeUserFromRoom(room.id, firebaseUser?.uid);
      logUserLeftRoom(firebaseUser?.uid, room.id);
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

  if (isLoadingPage) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-180px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading chat...</p>
      </div>
    );
  }

  if (!firebaseUser || !authUserProfile) { // Check both for complete auth state
      return <p className="text-center py-10">Redirecting to login or profile setup...</p>;
  }


  return (
    <div className="flex flex-1 flex-col lg:flex-row gap-6">
      <Card className="flex flex-col max-h-[40vh] lg:max-h-full lg:w-1/4 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Users className="mr-2 h-5 w-5" /> Participants ({isRefreshingParticipants ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : room.userCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 pt-0 overflow-hidden">
          <ScrollArea className="flex-1 pr-3">
            {isRefreshingParticipants && usersInRoom.length === 0 && authUserProfile && (
              <div key={authUserProfile.id} className="flex items-center justify-between p-2 mb-2 rounded-md opacity-70">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={authUserProfile.avatarUrl} alt={authUserProfile.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{authUserProfile.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{authUserProfile.name} (You)</span>
                </div>
                 <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {usersInRoom.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 mb-2 rounded-md hover:bg-muted">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{user.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name} {user.id === authUserProfile?.id ? "(You)" : ""}</span>
                </div>
                {user.id !== authUserProfile?.id && (
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
            {!isRefreshingParticipants && usersInRoom.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-4">The room is empty.</p>
            )}
          </ScrollArea>
          <div className="mt-4 space-y-2 shrink-0">
             {/* Ring followers logic: check if current user is the *only* one in the room. */}
            {usersInRoom.length === 1 && authUserProfile && usersInRoom[0]?.id === authUserProfile.id && (
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
            {isLoadingMessages && messages.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Loading messages...</p>
            )}
            {!isLoadingMessages && messages.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No messages yet. Be the first to say something!</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-3 ${msg.sender.id === authUserProfile?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end max-w-[70%] ${msg.sender.id === authUserProfile?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                   <Avatar className="h-8 w-8 mx-2 order-1">
                    <AvatarImage src={msg.sender.avatarUrl} alt={msg.sender.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{msg.sender.name ? msg.sender.name.substring(0,1).toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`p-3 rounded-lg shadow ${
                      msg.sender.id === authUserProfile?.id
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-foreground rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm font-medium mb-0.5">{msg.sender.name || 'Unknown User'}</p>
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
                disabled={authLoading || isLoadingPage || isLoadingMessages}
              />
              <Button type="submit" variant="default" disabled={authLoading || isLoadingPage || isLoadingMessages || newMessage.trim() === ''}>
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
