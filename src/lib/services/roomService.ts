
'use server';
/**
 * @fileOverview Room service for managing chat rooms.
 *
 * - getRoom - Fetches a specific room by ID.
 * - getAllRooms - Fetches all available rooms.
 * - createRoom - Creates a new room.
 * - getRoomParticipants - Fetches participants of a room.
 * - addUserToRoom - Adds a user to a room (mock).
 * - removeUserFromRoom - Removes a user from a room (mock).
 */
import type { Room, ChatUser, UserProfile } from '@/lib/types';
import { getUserProfile } from './userService'; // For fetching full profiles

// Mock database for rooms
let mockRooms: Room[] = [
  {
    id: 'cosmic-cafe',
    name: 'Cosmic Cafe',
    userCount: 0, 
    capacity: 15,
    description: 'Relax and chat in a cozy cosmic atmosphere.',
    image: 'https://placehold.co/600x400.png',
  },
  {
    id: 'nebula-lounge',
    name: 'Nebula Lounge',
    userCount: 0,
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

// Mock mapping of room IDs to participant user IDs (Firebase UIDs)
let mockRoomParticipants: Record<string, string[]> = {
    'cosmic-cafe': [], 
    'nebula-lounge': [], 
    'galaxy-galleria': [],
};


export async function getRoom(roomId: string): Promise<Room | null> {
  const room = mockRooms.find(r => r.id === roomId);
  if (room) {
    room.userCount = mockRoomParticipants[roomId]?.length || 0;
    return { ...room };
  }
  return null;
}

export async function getAllRooms(): Promise<Room[]> {
  return mockRooms.map(room => ({
    ...room,
    userCount: mockRoomParticipants[room.id]?.length || 0,
  }));
}

export async function createRoom(roomData: Omit<Room, 'id' | 'userCount' | 'image'> & {image?: string}): Promise<Room> {
  const newRoom: Room = {
    id: roomData.name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`,
    userCount: 0,
    ...roomData,
    image: roomData.image || 'https://placehold.co/600x400.png',
  };
  mockRooms.push(newRoom);
  mockRoomParticipants[newRoom.id] = [];
  return { ...newRoom };
}

export async function getRoomParticipants(roomId: string): Promise<ChatUser[]> {
    const participantIds = mockRoomParticipants[roomId] || [];
    const participantsPromises = participantIds.map(async (userId) => {
        const profile = await getUserProfile(userId); // Fetch full UserProfile
        if (profile) {
            return { // Map to ChatUser
                id: profile.id,
                name: profile.name,
                avatarUrl: profile.avatarUrl,
            };
        }
        return null;
    });
    const resolvedParticipants = await Promise.all(participantsPromises);
    
    return resolvedParticipants.filter((p): p is ChatUser => p !== null);
}

export async function addUserToRoom(roomId: string, userId: string): Promise<void> {
    // userId is expected to be Firebase UID
    const room = mockRooms.find(r => r.id === roomId);
    if (!room) {
        console.warn(`addUserToRoom: Room ${roomId} not found.`);
        return;
    }

    if (!mockRoomParticipants[roomId]) {
        mockRoomParticipants[roomId] = [];
    }
    if (!mockRoomParticipants[roomId].includes(userId)) {
        if (mockRoomParticipants[roomId].length < room.capacity) {
            mockRoomParticipants[roomId].push(userId);
            room.userCount = mockRoomParticipants[roomId].length;
            // console.log(`User ${userId} added to room ${roomId}. Participants:`, mockRoomParticipants[roomId].length);
        } else {
            // console.warn(`Room ${roomId} is full. Cannot add user ${userId}.`);
        }
    } else {
        // console.log(`User ${userId} already in room ${roomId}. Updating count just in case.`);
        room.userCount = mockRoomParticipants[roomId].length; // Ensure count is accurate
    }
}

export async function removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    // userId is expected to be Firebase UID
    if (mockRoomParticipants[roomId]) {
        const initialCount = mockRoomParticipants[roomId].length;
        mockRoomParticipants[roomId] = mockRoomParticipants[roomId].filter(id => id !== userId);
        const room = mockRooms.find(r => r.id === roomId);
        if (room) {
            room.userCount = mockRoomParticipants[roomId].length;
        }
        // if (initialCount > room.userCount) {
            // console.log(`User ${userId} removed from room ${roomId}. Participants:`, room?.userCount);
        // }
    } else {
      // console.log(`removeUserFromRoom: No participants list for room ${roomId} or user ${userId} not found.`);
    }
}
