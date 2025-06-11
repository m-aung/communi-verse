
"use client";

import type React from 'react';
import { useState, useEffect, createContext, useContext } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '@/lib/firebase/clientApp';
import type { ChatUser } from '@/lib/types';
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
  const [loading, setLoading] = useState(true); // This is authLoading
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Set basic user information immediately from Firebase
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${(fbUser.displayName || fbUser.email || 'U').substring(0,1).toUpperCase()}`
        });
        setLoading(false); // Firebase auth state is known, set loading to false.

        // Asynchronously fetch/create the detailed app profile and update user context
        try {
          let appProfile = await fetchUserServiceProfile(fbUser.uid);
          if (!appProfile) {
            const newName = fbUser.displayName || fbUser.email?.split('@')[0] || 'New User';
            appProfile = await createUserProfile({ 
              id: fbUser.uid, 
              name: newName, 
              email: fbUser.email || '',
              avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${newName.substring(0,1).toUpperCase()}`,
              isOnline: false, 
              bio: '' 
            });
          }
          
          if (appProfile) {
            setUser({ // Update user context with more detailed profile
              id: appProfile.id,
              name: appProfile.name,
              avatarUrl: appProfile.avatarUrl,
            });
          }
        } catch (profileError) {
          console.error("Error fetching/creating app profile:", profileError);
          // The user context already has basic info from Firebase, so the app can proceed.
        }
      } else {
        setUser(null);
        setLoading(false); // Firebase auth state known (no user).
      }
    });

    return () => unsubscribe();
  }, []); // Empty dependency array is correct for onAuthStateChanged

  const login = async (email: string, pass: string) => {
    setLoading(true); // Indicate loading during login process
    await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged will handle setting user and setLoading(false)
    router.push('/');
  };

  const signup = async (email: string, pass: string, name: string) => {
    setLoading(true); // Indicate loading during signup process
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    if (fbUser) {
      // Create a corresponding profile in our userService
      // This is now also done in onAuthStateChanged, but can be kept here for immediate profile creation if desired.
      // However, to avoid races, it's often better to let onAuthStateChanged handle profile sync.
      // For this change, we'll rely on onAuthStateChanged to create the profile if it doesn't exist.
      // We could pre-create it here, but the async nature of onAuthStateChanged should pick it up.
       await createUserProfile({
        id: fbUser.uid,
        name: name,
        email: fbUser.email || '',
        avatarUrl: `https://placehold.co/40x40.png?text=${name.substring(0,1).toUpperCase()}`,
        isOnline: false,
        bio: '',
      });
    }
    // onAuthStateChanged will handle setting user and setLoading(false)
    router.push('/');
  };

  const logout = async () => {
    setLoading(true); // Indicate loading during logout process
    await firebaseSignOut(auth);
    // onAuthStateChanged will handle setting user to null and setLoading(false)
    router.push('/login');
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
