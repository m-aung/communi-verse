
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
 * - listenToRoomParticipants - Sets up a real-time listener for room participants.
 */
import type { Room, ChatUser } from '@/lib/types';
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
  onSnapshot,
  type Unsubscribe, // Added for listener cleanup and return type
  type DocumentSnapshot // For transformRoomDoc if ever used with v9 DocumentSnapshot
} from 'firebase/firestore';
import { getUserProfile } from './userService';

// Helper to transform Firestore doc data to Room type and add userCount
// Note: This helper uses a generic signature that might need adjustment
// if used broadly, ensuring it correctly handles v9 DocumentSnapshot.
// For now, it's not directly used by the listener logic in a way that causes issues.
const transformRoomDoc = (docSnap: DocumentSnapshot | { id: string; data: () => any; exists: () => boolean }): Room & { userCount: number } | null => {
  if (!docSnap.exists()) return null;
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
      return false; // Room is full
    }

    if (participantIds.includes(userId)) {
      return true; // User already in room
    }

    await updateDoc(roomDocRef, {
      participantIds: arrayUnion(userId),
    });
    return true;
  } catch (error) {
    console.error(`Error adding user ${userId} to room ${roomId}:`, error);
    return false;
  }
}

export async function removeUserFromRoom(roomId: string, userId: string): Promise<boolean> {
  try {
    const roomDocRef = doc(db, 'rooms', roomId);
    await updateDoc(roomDocRef, {
      participantIds: arrayRemove(userId),
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function listenToRoomParticipants(
  roomId: string,
  callback: (participants: ChatUser[], userCount: number) => void
): Promise<Unsubscribe> { // Return Promise<Unsubscribe>
  const roomDocRef = doc(db, 'rooms', roomId);

  const unsubscribeFunction = onSnapshot(roomDocRef, async (docSnap) => {
    if (docSnap.exists()) {
      const roomData = docSnap.data();
      const participantIds: string[] = roomData.participantIds || [];
      
      const participantsPromises = participantIds.map(async (userId) => {
        const profile = await getUserProfile(userId); // from userService
        if (profile) {
          return {
            id: profile.id,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
          };
        }
        return null; 
      });
      const resolvedParticipants = (await Promise.all(participantsPromises)).filter(
        (p): p is ChatUser => p !== null
      );
      
      callback(resolvedParticipants, participantIds.length);
    } else {
      console.warn(`Room ${roomId} not found while listening for participants.`);
      callback([], 0);
    }
  }, (error) => {
    console.error(`Error listening to room participants for room ${roomId}:`, error);
    callback([], 0); 
  });

  return unsubscribeFunction; // Return the unsubscribe function itself
}
