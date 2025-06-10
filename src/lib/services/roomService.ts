
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
import { getUserProfile } from './userService';

// Mock database for rooms
// Initial participants can be managed here or fetched dynamically
let mockRooms: Room[] = [
  {
    id: 'cosmic-cafe',
    name: 'Cosmic Cafe',
    userCount: 1, // Start with 1 if current user auto-joins or 0
    capacity: 15,
    description: 'Relax and chat in a cozy cosmic atmosphere.',
    image: 'https://placehold.co/600x400.png',
  },
  {
    id: 'nebula-lounge',
    name: 'Nebula Lounge',
    userCount: 2,
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

// Mock mapping of room IDs to participant user IDs
let mockRoomParticipants: Record<string, string[]> = {
    'cosmic-cafe': ['user-current'],
    'nebula-lounge': ['user-current', 'user-1'],
    'galaxy-galleria': [],
};


export async function getRoom(roomId: string): Promise<Room | null> {
  // In a real app, fetch from database
  const room = mockRooms.find(r => r.id === roomId);
  if (room) {
    // Update userCount based on mockRoomParticipants for consistency
    room.userCount = mockRoomParticipants[roomId]?.length || 0;
    return { ...room };
  }
  return null;
}

export async function getAllRooms(): Promise<Room[]> {
  // In a real app, fetch from database
  // Update userCounts for all rooms
  return mockRooms.map(room => ({
    ...room,
    userCount: mockRoomParticipants[room.id]?.length || 0,
  }));
}

export async function createRoom(roomData: Omit<Room, 'id' | 'userCount' | 'image'> & {image?: string}): Promise<Room> {
  // In a real app, create in database
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
    // In a real app, fetch participant user IDs from room document or a subcollection,
    // then fetch their profiles.
    const participantIds = mockRoomParticipants[roomId] || [];
    const participantsPromises = participantIds.map(userId => getUserProfile(userId));
    const profiles = await Promise.all(participantsPromises);
    
    return profiles
        .filter((profile): profile is UserProfile => profile !== null)
        .map(profile => ({
            id: profile.id,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
        }));
}

export async function addUserToRoom(roomId: string, userId: string): Promise<void> {
    // In a real app, update room participant list and userCount
    if (!mockRoomParticipants[roomId]) {
        mockRoomParticipants[roomId] = [];
    }
    if (!mockRoomParticipants[roomId].includes(userId)) {
        mockRoomParticipants[roomId].push(userId);
        const room = mockRooms.find(r => r.id === roomId);
        if (room) {
            room.userCount = mockRoomParticipants[roomId].length;
        }
    }
    // console.log(`User ${userId} added to room ${roomId}. Participants:`, mockRoomParticipants[roomId]);
}

export async function removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    // In a real app, update room participant list and userCount
    if (mockRoomParticipants[roomId]) {
        mockRoomParticipants[roomId] = mockRoomParticipants[roomId].filter(id => id !== userId);
        const room = mockRooms.find(r => r.id === roomId);
        if (room) {
            room.userCount = mockRoomParticipants[roomId].length;
        }
    }
    // console.log(`User ${userId} removed from room ${roomId}. Participants:`, mockRoomParticipants[roomId]);
}
