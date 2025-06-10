
import { ChatClientPage } from '@/components/chat/chat-client-page';
import { getRoom } from '@/lib/services/roomService'; // Updated import
import type { Room } from '@/lib/types';
import { notFound } from 'next/navigation';

// This function is now a Server Component fetching data via a service
export default async function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const room = await getRoom(params.roomId);

  if (!room) {
    notFound();
  }

  return <ChatClientPage room={room} />;
}

// Optional: generateStaticParams could use getAllRooms if needed, but dynamic is fine.
// export async function generateStaticParams() {
//   const rooms = await getAllRooms();
//   return rooms.map((room) => ({
//     roomId: room.id,
//   }));
// }

export async function generateMetadata({ params }: { params: { roomId: string } }) {
  const room = await getRoom(params.roomId);
  return {
    title: room ? `${room.name} - CommuniVerse Chat` : 'Chat Room - CommuniVerse',
  };
}
