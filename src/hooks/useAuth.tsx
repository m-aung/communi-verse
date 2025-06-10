
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Try to get our app-specific user profile
        let appProfile = await fetchUserServiceProfile(fbUser.uid);
        if (!appProfile) {
          // If no profile exists, create a basic one (e.g., after social sign-in or if DB was cleared)
          // For email/password signup, this profile is created during the signup process.
          // We use a default name or the Firebase display name if available.
          const newName = fbUser.displayName || fbUser.email?.split('@')[0] || 'New User';
          appProfile = await createUserProfile({ 
            id: fbUser.uid, 
            name: newName, 
            email: fbUser.email || '',
            avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${newName.substring(0,1).toUpperCase()}`,
            isOnline: false, // Default to offline
            bio: '' 
          });
        }
        
        if (appProfile) {
          setUser({
            id: appProfile.id,
            name: appProfile.name,
            avatarUrl: appProfile.avatarUrl,
          });
        } else {
            // Fallback if profile creation also failed for some reason
             setUser({
                id: fbUser.uid,
                name: fbUser.displayName || fbUser.email || 'User',
                avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${(fbUser.displayName || fbUser.email || 'U').substring(0,1).toUpperCase()}`
            });
        }

      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, pass);
    // Auth state change will be handled by onAuthStateChanged
    // setLoading(false) will be called by onAuthStateChanged
    router.push('/');
  };

  const signup = async (email: string, pass: string, name: string) => {
    setLoading(true);
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    if (fbUser) {
      // Create a corresponding profile in our userService
      await createUserProfile({
        id: fbUser.uid, // Use Firebase UID as our profile ID
        name: name,
        email: fbUser.email || '',
        avatarUrl: `https://placehold.co/40x40.png?text=${name.substring(0,1).toUpperCase()}`,
        isOnline: false,
        bio: '',
      });
    }
    // Auth state change will be handled by onAuthStateChanged
    router.push('/');
  };

  const logout = async () => {
    setLoading(true);
    await firebaseSignOut(auth);
    // Auth state change will be handled by onAuthStateChanged
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
