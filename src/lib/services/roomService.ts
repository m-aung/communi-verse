
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
import type { Room, ChatUser } from '@/lib/types';
import { getUserProfile } from './userService'; // For fetching full profiles

// Mock database for rooms
let mockRooms: Room[] = [
  {
    id: 'cosmic-cafe',
    name: 'Cosmic Cafe',
    // userCount will be derived
    capacity: 15,
    description: 'Relax and chat in a cozy cosmic atmosphere.',
    image: 'https://placehold.co/600x400.png',
    userCount: 0
  },
  {
    id: 'nebula-lounge',
    name: 'Nebula Lounge',
    // userCount will be derived
    capacity: 15,
    description: 'Discuss the latest stellar news in this vibrant lounge.',
    image: 'https://placehold.co/600x400.png',
    userCount: 0
  },
  {
    id: 'galaxy-galleria',
    name: 'Galaxy Galleria',
    // userCount will be derived
    capacity: 15,
    description: 'A quiet place for deep conversations and making new friends.',
    image: 'https://placehold.co/600x400.png',
    userCount: 0
  },
];

// Mock mapping of room IDs to participant user IDs (Firebase UIDs or mock UIDs)
const mockRoomParticipants: Record<string, string[]> = {
    'cosmic-cafe': ['user-alice-mock', 'user-charlie-mock'], 
    'nebula-lounge': [], // This room will now have 0 users
    'galaxy-galleria': ['user-diana-mock', 'user-alice-mock', 'user-bob-mock'],
};


export async function getRoom(roomId: string): Promise<Room | null> {
  const room = mockRooms.find(r => r.id === roomId);
  if (room) {
    // Dynamically set userCount based on participants
    return { ...room, userCount: mockRoomParticipants[roomId]?.length || 0 };
  }
  return null;
}

export async function getAllRooms(): Promise<Room[]> {
  // Dynamically set userCount for all rooms
  return mockRooms.map(room => ({
    ...room,
    userCount: mockRoomParticipants[room.id]?.length || 0,
  }));
}

export async function createRoom(roomData: Omit<Room, 'id' | 'userCount' | 'image'> & {image?: string}): Promise<Room> {
  const newRoom: Room = {
    id: roomData.name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`,
    userCount: 0, // New rooms start empty
    ...roomData,
    image: roomData.image || 'https://placehold.co/600x400.png',
  };
  mockRooms.push(newRoom);
  mockRoomParticipants[newRoom.id] = []; // Initialize empty participants list
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
        // console.warn(`addUserToRoom: Room ${roomId} not found.`);
        return;
    }

    if (!mockRoomParticipants[roomId]) {
        mockRoomParticipants[roomId] = [];
    }
    if (!mockRoomParticipants[roomId].includes(userId)) {
        if ((mockRoomParticipants[roomId]?.length || 0) < room.capacity) {
            mockRoomParticipants[roomId].push(userId);
            // console.log(`User ${userId} added to room ${roomId}. Participants:`, mockRoomParticipants[roomId].length);
        } else {
            // console.warn(`Room ${roomId} is full. Cannot add user ${userId}.`);
        }
    } else {
        // console.log(`User ${userId} already in room ${roomId}.`);
    }
}

export async function removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    // userId is expected to be Firebase UID
    if (mockRoomParticipants[roomId]) {
        mockRoomParticipants[roomId] = mockRoomParticipants[roomId].filter(id => id !== userId);
        // console.log(`User ${userId} removed from room ${roomId}. Participants:`, mockRoomParticipants[roomId]?.length || 0);
    } else {
      // console.log(`removeUserFromRoom: No participants list for room ${roomId} or user ${userId} not found.`);
    }
}

