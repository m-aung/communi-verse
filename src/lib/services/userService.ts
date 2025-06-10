
'use server';
/**
 * @fileOverview User service for managing user profiles.
 * Links with Firebase Auth UID.
 *
 * - getUserProfile - Fetches a user profile by Firebase UID.
 * - updateUserProfile - Updates a user profile.
 * - createUserProfile - Creates a new user profile.
 * - getAllUsers - Fetches all user profiles (for mocking purposes).
 * - getCurrentUser - Fetches the current authenticated user's ChatUser representation.
 */
import type { UserProfile, ChatUser } from '@/lib/types';
import { auth } from '@/lib/firebase/clientApp'; // To check auth state if needed, though primarily driven by hook

// Mock database for user profiles, ID should now be Firebase UID
let mockUserProfiles: UserProfile[] = [
  // Example: { id: 'firebase-uid-1', name: 'Alice', avatarUrl: '...', isOnline: true, email: 'alice@example.com', bio: '...' },
];

// Initialize some default users if the list is empty (for dev/mocking)
if (mockUserProfiles.length === 0) {
    mockUserProfiles.push(
        { id: 'user-alice-mock', name: 'Alice (Mock)', avatarUrl: 'https://placehold.co/40x40.png?text=A', isOnline: true, email: 'alice@example.com', bio: 'Loves coding.' },
        { id: 'user-bob-mock', name: 'Bob (Mock)', avatarUrl: 'https://placehold.co/40x40.png?text=B', isOnline: false, email: 'bob@example.com', bio: 'Enjoys hiking.' }
    );
}


export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // userId is expected to be Firebase UID
  const profile = mockUserProfiles.find(p => p.id === userId);
  return profile ? { ...profile } : null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  return [...mockUserProfiles];
}

export async function getCurrentUser(): Promise<ChatUser | null> {
  // This function's purpose changes slightly.
  // The `useAuth` hook is the primary source of the current FirebaseUser and basic ChatUser.
  // This function could be used by server components that need user info if they can't use the hook,
  // or to get the *extended* UserProfile based on Firebase auth.
  // For simplicity, we'll assume this might be called server-side or where `useAuth` isn't available.
  // In a real app with server-side auth checks, this would be different.

  // The following is a conceptual placeholder for how it might work.
  // It doesn't have access to the client-side Firebase auth state directly here.
  // Components should rely on `useAuth` for the current user.
  // This mock will return the first user for demonstration if no specific logic is in place.
  
  // If we want this to reflect the *currently signed-in Firebase user's app profile*:
  // This function would typically be called with a UID from a server-side auth check.
  // Since we are in a 'use server' file and `auth` from `clientApp` is client-side,
  // we can't directly use `auth.currentUser` here reliably for server execution.
  // The `useAuth` hook is the correct way to get the current user on the client.

  // Let's adjust it: this function is now less about "the" current user,
  // and more about "a" user profile if `useAuth` isn't available.
  // For actual "current user" object, useAuth hook is the way.
  // Let's return null to emphasize that `useAuth` is the source of truth for the current user.
  return null; 
}


export async function updateUserProfile(userId: string, data: Partial<Omit<UserProfile, 'id'>>): Promise<UserProfile | null> {
  // userId is expected to be Firebase UID
  const profileIndex = mockUserProfiles.findIndex(p => p.id === userId);
  if (profileIndex !== -1) {
    mockUserProfiles[profileIndex] = { ...mockUserProfiles[profileIndex], ...data };
    return { ...mockUserProfiles[profileIndex] };
  }
  return null;
}

export async function createUserProfile(profileData: UserProfile): Promise<UserProfile> {
  // profileData.id is expected to be Firebase UID
  const existing = mockUserProfiles.find(p => p.id === profileData.id);
  if (existing) {
    // If user already exists (e.g. logged in before, profile created, then logged out and signed up again with same email)
    // We can either throw an error, or update the existing profile. Let's update.
    const profileIndex = mockUserProfiles.findIndex(p => p.id === profileData.id);
    mockUserProfiles[profileIndex] = { ...mockUserProfiles[profileIndex], ...profileData };
    return { ...mockUserProfiles[profileIndex] };
  }
  
  const newUserProfile: UserProfile = { 
    ...profileData, 
    // Ensure defaults if not provided
    isOnline: profileData.isOnline !== undefined ? profileData.isOnline : false,
    bio: profileData.bio || '',
    avatarUrl: profileData.avatarUrl || `https://placehold.co/40x40.png?text=${profileData.name.substring(0,1).toUpperCase()}`,
   };
  mockUserProfiles.push(newUserProfile);
  return { ...newUserProfile };
}
