
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

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error("getUserProfile: userId is undefined or null");
    return null;
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      return { id: userDocSnap.id, ...data } as UserProfile;
    } else {
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
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      return null;
    }
    await updateDoc(userDocRef, data);
    const updatedProfile = await getUserProfile(userId); 
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
    throw error; 
  }
}
