
export interface UserProfile {
  id: string; // Corresponds to Firebase Auth UID or a unique ID
  name: string;
  avatarUrl?: string;
  email?: string;
  bio?: string;
  isOnline?: boolean;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  image?: string;
  description?: string;
  participantIds: string[]; // Array of Firebase UIDs for users in the room
  // userCount will be derived from participantIds.length when fetching
}

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: ChatUser;
  text: string;
  timestamp: Date;
  roomId: string;
}

export interface RoomChatArchive {
  id: string; // Archive ID
  roomId: string;
  archivedAt: Date;
  messages: ChatMessage[];
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceUSD: number;
  image?: string;
  description?: string;
}

// Telemetry Action Types
export interface UserActionBase {
  id?: string; // Firestore will generate this
  userId: string; // The user performing the action (Firebase UID)
  timestamp: any; // Firestore serverTimestamp placeholder, will be set by server
  actionType: 'giftSent' | 'userFollowed' | 'userLeftRoom';
  roomId: string; // Context where the action occurred
}

export interface GiftSentAction extends UserActionBase {
  actionType: 'giftSent';
  payload: {
    gifterId: string; // Typically same as userId in UserActionBase
    receiverId: string;
    // giftDetails?: any; // e.g. coinAmount, could be added later
  };
}

export interface UserFollowedAction extends UserActionBase {
  actionType: 'userFollowed';
  payload: {
    followerId: string; // Typically same as userId in UserActionBase
    followedUserId: string;
  };
}

export interface UserLeftRoomAction extends UserActionBase {
  actionType: 'userLeftRoom';
  payload: {
    // No specific payload needed beyond base info for leaving
  };
}

export type UserAction = GiftSentAction | UserFollowedAction | UserLeftRoomAction;
