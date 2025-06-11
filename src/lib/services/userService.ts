
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
        { id: 'user-alice-mock', name: 'Alice Wonderland', avatarUrl: 'https://placehold.co/40x40.png?text=AW', isOnline: true, email: 'alice@example.com', bio: 'Loves exploring rabbit holes.' },
        { id: 'user-bob-mock', name: 'Bob The Builder', avatarUrl: 'https://placehold.co/40x40.png?text=BB', isOnline: false, email: 'bob@example.com', bio: 'Can he fix it? Yes, he can!' },
        { id: 'user-charlie-mock', name: 'Charlie Brown', avatarUrl: 'https://placehold.co/40x40.png?text=CB', isOnline: true, email: 'charlie@example.com', bio: 'Good grief.' },
        { id: 'user-diana-mock', name: 'Diana Prince', avatarUrl: 'https://placehold.co/40x40.png?text=DP', isOnline: false, email: 'diana@example.com', bio: 'Fighting for those who cannot fight for themselves.' }
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
  // If profile doesn't exist, let's create it as part of the update, common for first-time updates.
  const { name, email, avatarUrl, isOnline, bio } = data;
  if (name && email) { // Basic requirement for a new profile
    const newProfile: UserProfile = {
      id: userId,
      name: name,
      email: email,
      avatarUrl: avatarUrl || `https://placehold.co/40x40.png?text=${name.substring(0,1).toUpperCase()}`,
      isOnline: isOnline || false,
      bio: bio || '',
    };
    return await createUserProfile(newProfile);
  }
  return null;
}

export async function createUserProfile(profileData: UserProfile): Promise<UserProfile> {
  // profileData.id is expected to be Firebase UID
  const existingIndex = mockUserProfiles.findIndex(p => p.id === profileData.id);
  if (existingIndex !== -1) {
    // If user already exists, update the existing profile.
    mockUserProfiles[existingIndex] = { ...mockUserProfiles[existingIndex], ...profileData };
    return { ...mockUserProfiles[existingIndex] };
  }
  
  const newUserProfile: UserProfile = { 
    ...profileData, 
    isOnline: profileData.isOnline !== undefined ? profileData.isOnline : false,
    bio: profileData.bio || '',
    avatarUrl: profileData.avatarUrl || `https://placehold.co/40x40.png?text=${profileData.name.substring(0,1).toUpperCase()}`,
   };
  mockUserProfiles.push(newUserProfile);
  return { ...newUserProfile };
}
