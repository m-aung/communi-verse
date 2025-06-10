
'use server';
/**
 * @fileOverview Chat service for managing messages and archives.
 *
 * - getChatMessages - Fetches messages for a room.
 * - addChatMessage - Adds a new message to a room.
 * - archiveRoomChatHistory - Archives chat history for a room (simulates nightly job).
 * - getArchivedRoomChat - Fetches an archived chat.
 */
import type { ChatMessage, RoomChatArchive, ChatUser } from '@/lib/types';

// Mock database for messages and archives
let mockMessagesByRoom: Record<string, ChatMessage[]> = {
  'cosmic-cafe': [
    { id: 'msg1-cc', roomId: 'cosmic-cafe', sender: { id: 'user-1', name: 'Alice', avatarUrl: 'https://placehold.co/40x40.png?text=A' }, text: 'Hello Cosmic Cafe!', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  ],
  'nebula-lounge': [
    { id: 'msg1-nl', roomId: 'nebula-lounge', sender: { id: 'user-2', name: 'Bob', avatarUrl: 'https://placehold.co/40x40.png?text=B' }, text: 'Welcome to the Nebula!', timestamp: new Date(Date.now() - 1000 * 60 * 10) },
    { id: 'msg2-nl', roomId: 'nebula-lounge', sender: { id: 'user-1', name: 'Alice', avatarUrl: 'https://placehold.co/40x40.png?text=A' }, text: 'Glad to be here.', timestamp: new Date(Date.now() - 1000 * 60 * 8) },
  ],
};
let mockArchivedChats: RoomChatArchive[] = [];

export async function getChatMessages(roomId: string, _limit?: number): Promise<ChatMessage[]> {
  // In a real app, fetch from database, possibly with pagination (limit)
  return [...(mockMessagesByRoom[roomId] || [])];
}

export async function addChatMessage(roomId: string, sender: ChatUser, text: string): Promise<ChatMessage> {
  // In a real app, save to database
  if (!mockMessagesByRoom[roomId]) {
    mockMessagesByRoom[roomId] = [];
  }
  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    roomId,
    sender,
    text,
    timestamp: new Date(),
  };
  mockMessagesByRoom[roomId].push(newMessage);
  return { ...newMessage };
}

export async function archiveRoomChatHistory(roomId: string): Promise<RoomChatArchive | null> {
  /**
   * This function simulates a nightly job.
   * In a real application, this would be triggered by a scheduled function (e.g., Cloud Function with Cron).
   * It archives the current messages for the room and then clears them.
   */
  const messagesToArchive = mockMessagesByRoom[roomId];
  if (!messagesToArchive || messagesToArchive.length === 0) {
    // console.log(`No messages to archive for room ${roomId}`);
    return null;
  }

  const archive: RoomChatArchive = {
    id: `archive-${roomId}-${Date.now()}`,
    roomId,
    archivedAt: new Date(),
    messages: [...messagesToArchive],
  };
  mockArchivedChats.push(archive);
  mockMessagesByRoom[roomId] = []; // Clear current messages

  // console.log(`Archived ${archive.messages.length} messages for room ${roomId}. Archive ID: ${archive.id}`);
  // In a real app, old archives might be deleted based on retention policy.
  return { ...archive };
}

export async function getArchivedRoomChat(archiveId: string): Promise<RoomChatArchive | null> {
  // In a real app, fetch from archive storage
  const archive = mockArchivedChats.find(a => a.id === archiveId);
  return archive || null;
}

// Example of how a nightly job might be conceptualized (this wouldn't run automatically here)
export async function runNightlyJobsForAllRooms(roomIds: string[]): Promise<void> {
    console.log("Starting nightly archive jobs...");
    for (const roomId of roomIds) {
        await archiveRoomChatHistory(roomId);
    }
    console.log("Finished nightly archive jobs.");
}
