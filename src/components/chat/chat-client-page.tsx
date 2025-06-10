"use client";

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, ChatUser, Room } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bell, Gift, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatClientPageProps {
  room: Room; // Initial room data
}

const mockCurrentUser: ChatUser = { id: 'user-current', name: 'You', avatarUrl: 'https://placehold.co/40x40.png' };

const generateMockUsers = (count: number): ChatUser[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    avatarUrl: `https://placehold.co/40x40.png?text=U${i+1}`,
  }));
};


export function ChatClientPage({ room: initialRoom }: ChatClientPageProps) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [usersInRoom, setUsersInRoom] = useState<ChatUser[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Mock fetching users and initial messages
    const initialUsers = generateMockUsers(room.userCount > 0 ? room.userCount -1 : 0); // subtract current user if count > 0
    const allUsers = room.userCount > 0 ? [mockCurrentUser, ...initialUsers].slice(0, room.capacity) : [];
    setUsersInRoom(allUsers);

    setMessages([
      { id: 'msg1', sender: initialUsers[0] || {id:'system', name:'System'}, text: `Welcome to ${room.name}!`, timestamp: new Date() },
    ]);
  }, [room.id, room.name, room.userCount, room.capacity]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: mockCurrentUser,
      text: newMessage,
      timestamp: new Date(),
    };
    setMessages([...messages, message]);
    setNewMessage('');
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] max-h-[800px]">
      {/* User List Sidebar */}
      <Card className="lg:w-1/4 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Users className="mr-2 h-5 w-5" /> Participants ({usersInRoom.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-300px)] lg:h-auto max-h-[650px] pr-3">
            {usersInRoom.length === 0 && room.userCount === 0 && (
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
                {user.id !== mockCurrentUser.id && (
                  <Button variant="ghost" size="sm" onClick={() => handleGiftCoins(user)} title={`Gift coins to ${user.name}`}>
                    <Gift className="h-4 w-4 text-yellow-500" />
                  </Button>
                )}
              </div>
            ))}
          </ScrollArea>
          {usersInRoom.length <= 1 && ( // Show if only current user or empty
            <Button onClick={handleRingFriends} variant="outline" className="w-full mt-4">
              <Bell className="mr-2 h-4 w-4" /> Ring Friends
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-xl">{room.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-3 ${msg.sender.id === mockCurrentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end max-w-[70%] ${msg.sender.id === mockCurrentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
                   <Avatar className="h-8 w-8 mx-2 order-1">
                    <AvatarImage src={msg.sender.avatarUrl} alt={msg.sender.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{msg.sender.name.substring(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`p-3 rounded-lg ${
                      msg.sender.id === mockCurrentUser.id
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
              />
              <Button type="submit" variant="default">
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
