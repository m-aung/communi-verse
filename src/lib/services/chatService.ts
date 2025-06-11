
'use server';
/**
 * @fileOverview Chat service for managing messages in Firestore.
 *
 * - getChatMessages - Fetches messages for a room from Firestore.
 * - addChatMessage - Adds a new message to a room in Firestore.
 */
import type { ChatMessage, ChatUser } from '@/lib/types';
import { db } from '@/lib/firebase/clientApp';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  doc // Required for subcollections
} from 'firebase/firestore';

export async function getChatMessages(roomId: string, count?: number): Promise<ChatMessage[]> {
  try {
    const roomDocRef = doc(db, 'rooms', roomId);
    const messagesCollectionRef = collection(roomDocRef, 'messages');
    
    let q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));
    if (count) {
      q = query(messagesCollectionRef, orderBy('timestamp', 'desc'), firestoreLimit(count));
      // If limiting, we fetched in reverse to get the latest, so we'll reverse again before returning.
    }

    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        roomId: roomId, // or data.roomId if stored in message doc
        sender: data.sender as ChatUser,
        text: data.text,
        timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(), // Convert Firestore Timestamp to JS Date
      } as ChatMessage;
    });

    // If we fetched with limit (in desc order to get latest), reverse to asc for display
    return count ? messages.reverse() : messages;

  } catch (error) {
    console.error(`Error fetching messages for room ${roomId}:`, error);
    return [];
  }
}

export async function addChatMessage(roomId: string, sender: ChatUser, text: string): Promise<ChatMessage> {
  try {
    const roomDocRef = doc(db, 'rooms', roomId);
    const messagesCollectionRef = collection(roomDocRef, 'messages');

    const newMessageData = {
      roomId, // Good to have roomId denormalized here for broader queries if needed later
      sender,
      text,
      timestamp: serverTimestamp(), // Firestore will set this
    };

    const docRef = await addDoc(messagesCollectionRef, newMessageData);
    
    // For immediate feedback, we can construct the message object.
    // The timestamp will be null initially until the server processes it.
    // Or we could re-fetch, but that's an extra read.
    // For now, return with a client-side timestamp or indicate it's pending.
    // Let's assume the client will handle the pending timestamp or re-fetch if exact server time is critical immediately.
    return {
      id: docRef.id,
      roomId,
      sender,
      text,
      timestamp: new Date(), // Placeholder, actual timestamp set by server
    } as ChatMessage;

  } catch (error) {
    console.error(`Error adding message to room ${roomId}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
}

// Archiving functionality has been removed for now as it requires a more complex backend setup.
// - archiveRoomChatHistory
// - getArchivedRoomChat
// - runNightlyJobsForAllRooms
// These functions would need to be re-implemented using Firestore-native solutions,
// potentially involving scheduled Cloud Functions for moving/managing old data.
