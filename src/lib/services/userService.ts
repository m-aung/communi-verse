
'use server';
/**
 * @fileOverview User service for managing user profiles in Firestore.
 * Links with Firebase Auth UID.
 *
 * - getUserProfile - Fetches a user profile by Firebase UID from Firestore.
 * - updateUserProfile - Updates a user profile in Firestore.
 * - createUserProfile - Creates a new user profile in Firestore.
 * - getAllUsers - Fetches all user profiles from Firestore.
 */
import type { UserProfile } from '@/lib/types';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, Timestamp } from 'firebase/firestore';

// Mock database (mockUserProfiles array) is now removed. Firestore is the source of truth.

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error("getUserProfile: userId is undefined or null");
    return null;
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // Convert Firestore Timestamps to JS Date objects if necessary
      const data = userDocSnap.data();
      // Example: if you store dates and they come back as Timestamps
      // if (data.createdAt && data.createdAt instanceof Timestamp) {
      //   data.createdAt = data.createdAt.toDate();
      // }
      return { id: userDocSnap.id, ...data } as UserProfile;
    } else {
      // console.log(`No profile found for user ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching user profile for ${userId}:`, error);
    return null;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersCollectionRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    const users: UserProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function updateUserProfile(userId: string, data: Partial<Omit<UserProfile, 'id'>>): Promise<UserProfile | null> {
  if (!userId) {
    console.error("updateUserProfile: userId is undefined or null");
    return null;
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    // Ensure document exists before updating, or handle potential error
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      // console.warn(`Attempted to update non-existent profile for user ${userId}. Consider creating first.`);
      // Optionally, create it here if that's desired behavior for an "update"
      // For now, we'll stick to strict update. ProfileForm should only call this if profile exists.
      return null;
    }
    await updateDoc(userDocRef, data);
    const updatedProfile = await getUserProfile(userId); // Fetch the updated profile
    return updatedProfile;
  } catch (error) {
    console.error(`Error updating user profile for ${userId}:`, error);
    return null;
  }
}

export async function createUserProfile(profileData: UserProfile): Promise<UserProfile> {
   if (!profileData || !profileData.id) {
    throw new Error("createUserProfile: profileData or profileData.id is undefined or null");
  }
  try {
    const userDocRef = doc(db, 'users', profileData.id);
    
    // Ensure all required fields have defaults if not provided
    const completeProfileData: UserProfile = {
      ...profileData,
      name: profileData.name || 'New User',
      email: profileData.email || '',
      avatarUrl: profileData.avatarUrl || `https://placehold.co/40x40.png?text=${(profileData.name || 'N').substring(0,1).toUpperCase()}`,
      isOnline: profileData.isOnline !== undefined ? profileData.isOnline : false,
      bio: profileData.bio || '',
    };
    
    await setDoc(userDocRef, completeProfileData);
    return completeProfileData;
  } catch (error) {
    console.error(`Error creating user profile for ${profileData.id}:`, error);
    // Re-throw or return a specific error structure
    throw error; 
  }
}
