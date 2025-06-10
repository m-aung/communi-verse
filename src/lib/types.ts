
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
  userCount: number;
  capacity: number;
  image?: string;
  description?: string;
  // participants?: ChatUser[]; // Or fetch separately
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
