
'use server';
/**
 * @fileOverview Room service for managing chat rooms in Firestore.
 *
 * - getRoom - Fetches a specific room by ID.
 * - getAllRooms - Fetches all available rooms.
 * - createRoom - Creates a new room.
 * - getRoomParticipants - Fetches participants of a room.
 * - addUserToRoom - Adds a user to a room.
 * - removeUserFromRoom - Removes a user from a room.
 */
import type { Room, ChatUser, UserProfile } from '@/lib/types';
import { db } from '@/lib/firebase/clientApp';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  arrayUnion, 
  arrayRemove,
  deleteDoc // Added for potential future use, though not used in this refactor directly
} from 'firebase/firestore';
import { getUserProfile } from './userService';

// Helper to transform Firestore doc data to Room type and add userCount
const transformRoomDoc = (docSnap: firebase.firestore.DocumentSnapshot | { id: string; data: () => any }): Room & { userCount: number } | null => {
  if (!docSnap.exists && typeof docSnap.exists === 'function' && !docSnap.exists()) return null;
  const data = docSnap.data();
  if (!data) return null;
  
  const participantIds = data.participantIds || [];
  return {
    id: docSnap.id,
    name: data.name,
    capacity: data.capacity,
    image: data.image,
    description: data.description,
    participantIds: participantIds,
    userCount: participantIds.length, // Derived userCount
  } as Room & { userCount: number };
};


export async function getRoom(roomId: string): Promise<(Room & { userCount: number }) | null> {
  try {
    const roomDocRef = doc(db, 'rooms', roomId);
    const roomDocSnap = await getDoc(roomDocRef);
    if (roomDocSnap.exists()) {
      const data = roomDocSnap.data();
      const participantIds = data.participantIds || [];
      return {
        id: roomDocSnap.id,
        name: data.name,
        capacity: data.capacity,
        image: data.image,
        description: data.description,
        participantIds: participantIds,
        userCount: participantIds.length,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    return null;
  }
}

export async function getAllRooms(): Promise<(Room & { userCount: number })[]> {
  try {
    const roomsCollectionRef = collection(db, 'rooms');
    const querySnapshot = await getDocs(roomsCollectionRef);
    const rooms: (Room & { userCount: number })[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const participantIds = data.participantIds || [];
      rooms.push({
        id: docSnap.id,
        name: data.name,
        capacity: data.capacity,
        image: data.image,
        description: data.description,
        participantIds: participantIds,
        userCount: participantIds.length,
      });
    });
    return rooms;
  } catch (error) {
    console.error("Error fetching all rooms:", error);
    return [];
  }
}

export async function createRoom(roomData: Omit<Room, 'id' | 'participantIds'>): Promise<Room & { userCount: number }> {
  const roomId = roomData.name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`;
  const newRoomData: Room = {
    id: roomId,
    name: roomData.name,
    capacity: roomData.capacity,
    description: roomData.description || '',
    image: roomData.image || 'https://placehold.co/600x400.png',
    participantIds: [], // Initialize with empty participants
  };
  try {
    const roomDocRef = doc(db, 'rooms', roomId);
    await setDoc(roomDocRef, newRoomData);
    return { ...newRoomData, userCount: 0 };
  } catch (error) {
    console.error(`Error creating room ${newRoomData.name}:`, error);
    throw error;
  }
}

export async function getRoomParticipants(roomId: string): Promise<ChatUser[]> {
  try {
    const roomDocRef = doc(db, 'rooms', roomId);
    const roomDocSnap = await getDoc(roomDocRef);

    if (!roomDocSnap.exists()) {
      console.warn(`Room ${roomId} not found for fetching participants.`);
      return [];
    }
    const roomData = roomDocSnap.data();
    const participantIds: string[] = roomData.participantIds || [];

    const participantsPromises = participantIds.map(async (userId) => {
      const profile = await getUserProfile(userId);
      if (profile) {
        return {
          id: profile.id,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        };
      }
      return null;
    });
    const resolvedParticipants = await Promise.all(participantsPromises);
    return resolvedParticipants.filter((p): p is ChatUser => p !== null);
  } catch (error) {
    console.error(`Error fetching participants for room ${roomId}:`, error);
    return [];
  }
}

export async function addUserToRoom(roomId: string, userId: string): Promise<boolean> {
  try {
    const roomDocRef = doc(db, 'rooms', roomId);
    const roomDocSnap = await getDoc(roomDocRef);

    if (!roomDocSnap.exists()) {
      console.warn(`addUserToRoom: Room ${roomId} not found.`);
      return false;
    }
    const roomData = roomDocSnap.data();
    const participantIds: string[] = roomData.participantIds || [];

    if (participantIds.length >= roomData.capacity) {
      console.warn(`Room ${roomId} is full. Cannot add user ${userId}.`);
      return false; // Room is full
    }

    if (participantIds.includes(userId)) {
      // console.log(`User ${userId} already in room ${roomId}.`);
      return true; // User already in room
    }

    await updateDoc(roomDocRef, {
      participantIds: arrayUnion(userId),
    });
    // console.log(`User ${userId} added to room ${roomId}.`);
    return true;
  } catch (error) {
    console.error(`Error adding user ${userId} to room ${roomId}:`, error);
    return false;
  }
}

export async function removeUserFromRoom(roomId: string, userId: string): Promise<boolean> {
  try {
    const roomDocRef = doc(db, 'rooms', roomId);
    // It's okay if the room doesn't exist or user isn't in it, just try to remove.
    await updateDoc(roomDocRef, {
      participantIds: arrayRemove(userId),
    });
    // console.log(`User ${userId} removed from room ${roomId}.`);
    return true;
  } catch (error) {
    console.error(`Error removing user ${userId} from room ${roomId}:`, error);
    // If room doesn't exist, updateDoc might fail. Depending on desired behavior,
    // you might want to check if doc exists first. For now, we assume it's okay to fail silently.
    return false;
  }
}
