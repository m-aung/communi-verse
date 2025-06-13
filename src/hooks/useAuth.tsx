
"use client";

import type React from 'react';
import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  type User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/clientApp'; // Import db
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore'; // Import onSnapshot and doc
import type { UserProfile } from '@/lib/types'; 
import { createUserProfile, getUserProfile as fetchUserServiceProfile } from '@/lib/services/userService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  userProfile: UserProfile | null; // Changed from user: ChatUser
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Changed state name
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const unsubscribeProfileListenerRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      // Clean up previous profile listener if any
      if (unsubscribeProfileListenerRef.current) {
        unsubscribeProfileListenerRef.current();
        unsubscribeProfileListenerRef.current = null;
      }

      if (fbUser) {
        setLoading(true); // Start loading when fbUser is present, until profile is fetched/listened

        // Set up a real-time listener for the user's profile document
        const userDocRef = doc(db, 'users', fbUser.uid);
        unsubscribeProfileListenerRef.current = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            // Profile doesn't exist, attempt to create it (especially for new signups)
            // This might happen if signup process creates Firebase user before profile doc is ready
            // Or if fetchUserServiceProfile in signup somehow failed or was slow.
            // Let's try to fetch/create it one more time here if listener finds nothing.
            try {
              let profile = await fetchUserServiceProfile(fbUser.uid);
              if (!profile) {
                const nameForNewProfile = fbUser.displayName || fbUser.email?.split('@')[0] || 'New User';
                const newProfileData: UserProfile = { 
                  id: fbUser.uid, 
                  name: nameForNewProfile, 
                  email: fbUser.email || '',
                  avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${nameForNewProfile.substring(0,1).toUpperCase()}`,
                  isOnline: false, 
                  bio: '' 
                };
                profile = await createUserProfile(newProfileData); // This will be picked up by listener if successful
              }
              // If profile is fetched/created here, onSnapshot will eventually update userProfile state.
              // If still null, it means user truly has no profile record.
              if(!profile) setUserProfile(null) // Explicitly set to null if still not found
            } catch (error) {
              console.error("Error fetching/creating profile in auth listener fallback:", error);
              setUserProfile(null); // Set to null on error
            }
          }
          setLoading(false); // Profile loaded or attempt finished
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setUserProfile(null);
          setLoading(false);
        });

      } else {
        setUserProfile(null);
        setLoading(false); 
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfileListenerRef.current) {
        unsubscribeProfileListenerRef.current();
      }
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged and its profile listener will handle setting userProfile
    router.push('/');
  };

  const signup = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    if (fbUser) {
      // Create the profile. The onSnapshot listener in AuthProvider will pick up this change.
      const profileData: UserProfile = {
        id: fbUser.uid,
        name: name, 
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${name.substring(0,1).toUpperCase()}`,
        isOnline: false, // Default to offline, listener will update if already set otherwise
        bio: '',
      };
      try {
        await createUserProfile(profileData);
      } catch (error) {
        console.error("Error creating profile during signup:", error);
        // Potentially sign out the user or handle error more gracefully
      }
    }
    router.push('/');
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    // onAuthStateChanged will set firebaseUser and userProfile to null
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ userProfile, firebaseUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
