
import { OnlineStatusButton } from '@/components/dashboard/online-status-button';
import { RoomCard } from '@/components/dashboard/room-card';
import { getAllRooms } from '@/lib/services/roomService'; 
import type { Room } from '@/lib/types';

export default async function DashboardPage() {
  // Let TypeScript infer the type from getAllRooms, or use the more specific type
  const rooms = await getAllRooms(); // Type will be (Room & { userCount: number })[]

  return (
    <div className="space-y-12">
      <section className="text-center py-8 bg-card shadow-md rounded-lg">
        <h1 className="text-3xl font-bold font-headline mb-6">Welcome to CommuniVerse!</h1>
        <OnlineStatusButton />
      </section>

      <section>
        <h2 className="text-2xl font-semibold font-headline mb-6 text-center">Join a Room</h2>
        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              // Ensure room and room.id are valid before rendering RoomCard
              room && room.id ? <RoomCard key={room.id} room={room} /> : null
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No rooms available at the moment. Check back later!</p>
        )}
      </section>
    </div>
  );
}
