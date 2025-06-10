import { ChatClientPage } from '@/components/chat/chat-client-page';
import type { Room } from '@/lib/types';
import { notFound } from 'next/navigation';

// Mock function to fetch room data by ID
async function getRoomData(roomId: string): Promise<Room | null> {
  const mockRooms: Room[] = [
    { id: 'cosmic-cafe', name: 'Cosmic Cafe', userCount: 5, capacity: 15, description: 'Relax and chat...', image: 'https://placehold.co/600x400.png' },
    { id: 'nebula-lounge', name: 'Nebula Lounge', userCount: 12, capacity: 15, description: 'Discuss stellar news...', image: 'https://placehold.co/600x400.png' },
    { id: 'galaxy-galleria', name: 'Galaxy Galleria', userCount: 0, capacity: 15, description: 'A quiet place for conversations...', image: 'https://placehold.co/600x400.png' },
  ];
  return mockRooms.find(room => room.id === roomId) || null;
}

export default async function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const room = await getRoomData(params.roomId);

  if (!room) {
    notFound();
  }

  return <ChatClientPage room={room} />;
}

// Optional: Generate static paths if rooms are fixed
// export async function generateStaticParams() {
//   const mockRooms: Room[] = [
//     { id: 'cosmic-cafe', name: 'Cosmic Cafe', userCount: 5, capacity: 15 },
//     { id: 'nebula-lounge', name: 'Nebula Lounge', userCount: 12, capacity: 15 },
//     { id: 'galaxy-galleria', name: 'Galaxy Galleria', userCount: 0, capacity: 15 },
//   ];
//   return mockRooms.map((room) => ({
//     roomId: room.id,
//   }));
// }

export async function generateMetadata({ params }: { params: { roomId: string } }) {
  const room = await getRoomData(params.roomId);
  return {
    title: room ? `${room.name} - CommuniVerse Chat` : 'Chat Room - CommuniVerse',
  };
}
