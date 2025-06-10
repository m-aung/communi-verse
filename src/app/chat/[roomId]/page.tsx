
import { ChatClientPage } from '@/components/chat/chat-client-page';
import { getRoom } from '@/lib/services/roomService'; 
import type { Room } from '@/lib/types';
import { notFound } from 'next/navigation';

// This function is now a Server Component fetching data via a service
export default async function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const room = await getRoom(params.roomId);

  if (!room) {
    notFound();
  }

  // ChatClientPage now handles its own auth checks and data fetching based on auth user
  return <ChatClientPage room={room} />;
}


export async function generateMetadata({ params }: { params: { roomId: string } }) {
  const room = await getRoom(params.roomId);
  return {
    title: room ? `${room.name} - CommuniVerse Chat` : 'Chat Room - CommuniVerse',
  };
}
