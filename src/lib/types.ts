export interface Room {
  id: string;
  name: string;
  userCount: number;
  capacity: number;
  image?: string; // Placeholder image URL
  description?: string;
}

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string; // Placeholder image URL
}

export interface ChatMessage {
  id: string;
  sender: ChatUser;
  text: string;
  timestamp: Date;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceUSD: number;
  image?: string; // Placeholder image URL
  description?: string;
}
