
'use server';
/**
 * @fileOverview Telemetry service for logging user actions to Firestore.
 */
import { db } from '@/lib/firebase/clientApp';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { GiftSentAction, UserFollowedAction, UserLeftRoomAction } from '@/lib/types';

const USER_ACTIONS_COLLECTION = 'userActions';
const userActionsCollectionRef = collection(db, USER_ACTIONS_COLLECTION);

/**
 * Generic function to log a user action.
 * The 'id' and 'timestamp' fields will be handled by Firestore.
 */
async function logUserAction(actionData: Omit<GiftSentAction | UserFollowedAction | UserLeftRoomAction, 'id' | 'timestamp'>): Promise<void> {
  try {
    await addDoc(userActionsCollectionRef, {
      ...actionData,
      timestamp: serverTimestamp(), // Firestore will set the actual timestamp
    });
    // console.log('User action logged:', actionData.actionType);
  } catch (error) {
    console.error('Error logging user action:', error, actionData);
    // Silently fail for now, or implement more robust error handling/retry if needed.
  }
}

/**
 * Logs when a user sends a gift to another user.
 * @param gifterId - The UID of the user sending the gift.
 * @param receiverId - The UID of the user receiving the gift.
 * @param roomId - The ID of the room where the gift was sent.
 */
export async function logGiftSent(
  gifterId: string,
  receiverId: string,
  roomId: string
): Promise<void> {
  const action: Omit<GiftSentAction, 'id' | 'timestamp'> = {
    userId: gifterId, // The user performing the action
    actionType: 'giftSent',
    roomId,
    payload: {
      gifterId,
      receiverId,
    },
  };
  await logUserAction(action);
}

/**
 * Logs when a user follows another user.
 * @param followerId - The UID of the user performing the follow.
 * @param followedUserId - The UID of the user being followed.
 * @param roomId - The ID of the room where the follow action occurred.
 */
export async function logUserFollowed(
  followerId: string,
  followedUserId: string,
  roomId: string
): Promise<void> {
  const action: Omit<UserFollowedAction, 'id' | 'timestamp'> = {
    userId: followerId, // The user performing the action
    actionType: 'userFollowed',
    roomId,
    payload: {
      followerId,
      followedUserId,
    },
  };
  await logUserAction(action);
}

/**
 * Logs when a user leaves a room.
 * @param userId - The UID of the user leaving the room.
 * @param roomId - The ID of the room being left.
 */
export async function logUserLeftRoom(
  userId: string,
  roomId: string
): Promise<void> {
  const action: Omit<UserLeftRoomAction, 'id' | 'timestamp'> = {
    userId, // The user performing the action
    actionType: 'userLeftRoom',
    roomId,
    payload: {}, // No specific payload for leaving
  };
  await logUserAction(action);
}
