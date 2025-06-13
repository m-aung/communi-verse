
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
  writeBatch,
  type DocumentSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { getUserProfile } from './userService';

// Helper to transform Firestore doc data to Room type and add userCount
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
    admissionFee: data.admissionFee || 0,
    userCount: participantIds.length, // Derived userCount
  } as Room & { userCount: number };
};


export async function getRoom(roomId: string): Promise<(Room & { userCount: number }) | null> {
  try {
    const roomDocRef = doc(db, 'rooms', roomId);
    const roomDocSnap = await getDoc(roomDocRef);
    return transformRoomDoc(roomDocSnap);
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    return null;
  }
}

async function createDefaultRooms(): Promise<(Room & { userCount: number })[]> {
  const batch = writeBatch(db);
  const defaultRoomsData: Omit<Room, 'id' | 'participantIds' | 'userCount'>[] = [
    { name: 'Cosmic Cafe', capacity: 15, description: 'Relax and chat in a cozy cosmic atmosphere', image: 'https://placehold.co/600x400.png', admissionFee: 0 },
    { name: 'Nebula Lounge', capacity: 20, description: 'Discuss the latest stellar news in this vibrant lounge.', image: 'https://placehold.co/600x400.png', admissionFee: 0 },
    { name: 'VIP Skydeck', capacity: 10, description: 'Exclusive access room for VIP members.', image: 'https://placehold.co/600x400.png', admissionFee: 50 },
  ];

  const createdRooms: (Room & { userCount: number })[] = [];

  defaultRoomsData.forEach(roomData => {
    const roomId = roomData.name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now().toString().slice(-5)}`;
    const newRoom: Room = {
      id: roomId,
      ...roomData,
      participantIds: [],
    };
    const roomDocRef = doc(db, 'rooms', roomId);
    batch.set(roomDocRef, newRoom);
    createdRooms.push({ ...newRoom, userCount: 0 });
  });

  try {
    await batch.commit();
    console.log("Default rooms created successfully.");
    return createdRooms;
  } catch (error) {
    console.error("Error creating default rooms with batch:", error);
    throw error; // Re-throw to be handled by getAllRooms
  }
}


export async function getAllRooms(): Promise<(Room & { userCount: number })[]> {
  try {
    const roomsCollectionRef = collection(db, 'rooms');
    const querySnapshot = await getDocs(roomsCollectionRef);
    
    if (querySnapshot.empty) {
      console.log("No rooms found in Firestore. Creating default rooms...");
      return await createDefaultRooms();
    }

    const rooms: (Room & { userCount: number })[] = [];
    querySnapshot.forEach((docSnap) => {
      const room = transformRoomDoc(docSnap);
      if (room) {
        rooms.push(room);
      }
    });
    return rooms;
  } catch (error) {
    console.error("Error fetching all rooms:", error);
    // If createDefaultRooms failed, this will return empty or rethrow.
    // For robustness, might return [] or rethrow error
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
    admissionFee: roomData.admissionFee || 0,
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
        } as ChatUser;
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
      // console.warn(`addUserToRoom: Room ${roomId} is full. Capacity: ${roomData.capacity}, Participants: ${participantIds.length}`);
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
    // console.error(`Error removing user ${userId} from room ${roomId}:`, error);
    return false;
  }
}
