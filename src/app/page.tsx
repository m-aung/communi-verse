import { OnlineStatusButton } from '@/components/dashboard/online-status-button';
import { RoomCard } from '@/components/dashboard/room-card';
import type { Room } from '@/lib/types';

const mockRooms: Room[] = [
  {
    id: 'cosmic-cafe',
    name: 'Cosmic Cafe',
    userCount: 5,
    capacity: 15,
    description: 'Relax and chat in a cozy cosmic atmosphere.',
    image: 'https://placehold.co/600x400.png',
  },
  {
    id: 'nebula-lounge',
    name: 'Nebula Lounge',
    userCount: 12,
    capacity: 15,
    description: 'Discuss the latest stellar news in this vibrant lounge.',
    image: 'https://placehold.co/600x400.png',
  },
  {
    id: 'galaxy-galleria',
    name: 'Galaxy Galleria',
    userCount: 0,
    capacity: 15,
    description: 'A quiet place for deep conversations and making new friends.',
    image: 'https://placehold.co/600x400.png',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-8 bg-card shadow-md rounded-lg">
        <h1 className="text-3xl font-bold font-headline mb-6">Welcome to CommuniVerse!</h1>
        <OnlineStatusButton />
      </section>

      <section>
        <h2 className="text-2xl font-semibold font-headline mb-6 text-center">Join a Room</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>
    </div>
  );
}
