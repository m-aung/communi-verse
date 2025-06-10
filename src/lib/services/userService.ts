
'use server';
/**
 * @fileOverview User service for managing user profiles.
 *
 * - getUserProfile - Fetches a user profile.
 * - updateUserProfile - Updates a user profile.
 * - createUserProfile - Creates a new user profile.
 * - getAllUsers - Fetches all user profiles (for mocking purposes).
 * - getCurrentUser - Fetches the current mock user.
 */
import type { UserProfile, ChatUser } from '@/lib/types';

// Mock database for user profiles
let mockUserProfiles: UserProfile[] = [
  { id: 'user-current', name: 'You', avatarUrl: 'https://placehold.co/40x40.png?text=YOU', isOnline: false, email: 'you@example.com', bio: 'Just chilling.' },
  { id: 'user-1', name: 'Alice', avatarUrl: 'https://placehold.co/40x40.png?text=A', isOnline: true, email: 'alice@example.com', bio: 'Loves coding.' },
  { id: 'user-2', name: 'Bob', avatarUrl: 'https://placehold.co/40x40.png?text=B', isOnline: false, email: 'bob@example.com', bio: 'Enjoys hiking.' },
  { id: 'user-3', name: 'Charlie', avatarUrl: 'https://placehold.co/40x40.png?text=C', isOnline: true, email: 'charlie@example.com', bio: 'Tech enthusiast.' },
];

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // In a real app, fetch from database (e.g., Firestore)
  const profile = mockUserProfiles.find(p => p.id === userId);
  return profile || null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  return [...mockUserProfiles];
}

export async function getCurrentUser(): Promise<ChatUser> {
    // In a real app, this would come from an auth session
    const currentUserProfile = mockUserProfiles.find(p => p.id === 'user-current');
    if (!currentUserProfile) throw new Error("Current user not found"); // Should not happen with mock data
    return {
        id: currentUserProfile.id,
        name: currentUserProfile.name,
        avatarUrl: currentUserProfile.avatarUrl,
    };
}

export async function updateUserProfile(userId: string, data: Partial<Omit<UserProfile, 'id'>>): Promise<UserProfile | null> {
  // In a real app, update in database
  const profileIndex = mockUserProfiles.findIndex(p => p.id === userId);
  if (profileIndex !== -1) {
    mockUserProfiles[profileIndex] = { ...mockUserProfiles[profileIndex], ...data };
    return { ...mockUserProfiles[profileIndex] };
  }
  return null;
}

export async function createUserProfile(profileData: Omit<UserProfile, 'id'> & { id?: string }): Promise<UserProfile> {
  // In a real app, create in database
  const newId = profileData.id || `user-${Date.now()}`;
  const existing = mockUserProfiles.find(p => p.id === newId);
  if (existing) {
    throw new Error('User already exists');
  }
  const newUserProfile: UserProfile = { ...profileData, id: newId };
  mockUserProfiles.push(newUserProfile);
  return { ...newUserProfile };
}
