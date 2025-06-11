
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
        // Set basic user information immediately from Firebase for responsiveness
        // This name might be temporary if a more specific one is in userService
        const initialDisplayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
        setUser({
          id: fbUser.uid,
          name: initialDisplayName,
          avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${initialDisplayName.substring(0,1).toUpperCase()}`
        });
        setLoading(false); // Firebase auth state is known, set loading to false.

        // Asynchronously fetch/create the detailed app profile and update user context
        try {
          let appProfile = await fetchUserServiceProfile(fbUser.uid);
          if (!appProfile) {
            // Profile doesn't exist in our app's user service, let's create it.
            // Prioritize Firebase displayName, then a generic placeholder. Avoid email prefix.
            let nameForNewProfile = 'New User'; // Default placeholder
            if (fbUser.displayName && fbUser.displayName.trim() !== '') {
              nameForNewProfile = fbUser.displayName.trim();
            }
            
            appProfile = await createUserProfile({ 
              id: fbUser.uid, 
              name: nameForNewProfile, 
              email: fbUser.email || '',
              avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${nameForNewProfile.substring(0,1).toUpperCase()}`,
              isOnline: false, 
              bio: '' 
            });
          }
          
          if (appProfile) {
            setUser({ // Update user context with more detailed profile from userService
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
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true); 
    await signInWithEmailAndPassword(auth, email, pass);
    router.push('/');
  };

  const signup = async (email: string, pass: string, name: string) => {
    setLoading(true); 
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    if (fbUser) {
       await createUserProfile({
        id: fbUser.uid,
        name: name, // Name from the signup form
        email: fbUser.email || '',
        avatarUrl: `https://placehold.co/40x40.png?text=${name.substring(0,1).toUpperCase()}`,
        isOnline: false,
        bio: '',
      });
    }
    router.push('/');
  };

  const logout = async () => {
    setLoading(true); 
    await firebaseSignOut(auth);
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
