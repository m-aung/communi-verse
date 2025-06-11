
"use client";

import type React from 'react';
import { useState, useEffect, createContext, useContext } from 'react';
import { 
  type User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '@/lib/firebase/clientApp';
import type { ChatUser, UserProfile } from '@/lib/types'; // Added UserProfile
import { createUserProfile, getUserProfile as fetchUserServiceProfile } from '@/lib/services/userService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: ChatUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setLoading(true); // Start loading when fbUser is detected, before profile fetch
        const initialDisplayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
        // Set a basic user object immediately for responsiveness
        setUser({
          id: fbUser.uid,
          name: initialDisplayName,
          avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${initialDisplayName.substring(0,1).toUpperCase()}`
        });

        try {
          let appProfile = await fetchUserServiceProfile(fbUser.uid);
          if (!appProfile) {
            let nameForNewProfile = 'New User';
            if (fbUser.displayName && fbUser.displayName.trim() !== '') {
              nameForNewProfile = fbUser.displayName.trim();
            }
            
            const newProfileData: UserProfile = { 
              id: fbUser.uid, 
              name: nameForNewProfile, 
              email: fbUser.email || '',
              avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${nameForNewProfile.substring(0,1).toUpperCase()}`,
              isOnline: false, 
              bio: '' 
            };
            appProfile = await createUserProfile(newProfileData);
          }
          
          if (appProfile) {
            setUser({
              id: appProfile.id,
              name: appProfile.name,
              avatarUrl: appProfile.avatarUrl,
            });
          }
        } catch (profileError) {
          console.error("Error fetching/creating app profile in useAuth:", profileError);
          // User context still has basic info from Firebase.
        } finally {
          setLoading(false); // Stop loading after profile operations complete or fail
        }
      } else {
        setUser(null);
        setLoading(false); 
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true); 
    await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged will handle setting user and loading states.
    // Router push can happen after auth state is confirmed by onAuthStateChanged.
    // For now, keep it here for immediate redirect expectation.
    router.push('/');
  };

  const signup = async (email: string, pass: string, name: string) => {
    setLoading(true); 
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    if (fbUser) {
      // The onAuthStateChanged listener will also try to create a profile.
      // To avoid race conditions or double-creation, we can rely on onAuthStateChanged,
      // or ensure createUserProfile is idempotent or handles existing profiles gracefully.
      // Our Firestore createUserProfile uses setDoc, which is fine.
      // Let's ensure the name from signup form is used here.
      const profileData: UserProfile = {
        id: fbUser.uid,
        name: name, 
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${name.substring(0,1).toUpperCase()}`,
        isOnline: false,
        bio: '',
      };
      await createUserProfile(profileData);
      // Update the local user state immediately after signup too for better UX
      setUser({
        id: profileData.id,
        name: profileData.name,
        avatarUrl: profileData.avatarUrl,
      });
    }
    // onAuthStateChanged will also set loading to false after profile ops.
    router.push('/');
  };

  const logout = async () => {
    // setLoading(true); // Setting loading to true here might be too early if signOut is fast.
                        // onAuthStateChanged will handle setting user to null and loading to false.
    await firebaseSignOut(auth);
    router.push('/login');
    // setUser(null); // Handled by onAuthStateChanged
    // setLoading(false); // Handled by onAuthStateChanged
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, signup, logout }}>
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
