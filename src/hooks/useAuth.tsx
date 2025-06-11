
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
import type { ChatUser, UserProfile } from '@/lib/types'; 
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
        // setLoading(true) here makes authLoading reflect entire profile fetch too.
        // For faster UI responsiveness, set loading(false) earlier:
        const initialDisplayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
        setUser({ // Set basic user object immediately
          id: fbUser.uid,
          name: initialDisplayName,
          avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${initialDisplayName.substring(0,1).toUpperCase()}`
        });
        setLoading(false); // Firebase auth state resolved, set loading to false. Profile fetch happens next.

        try {
          let appProfile = await fetchUserServiceProfile(fbUser.uid);
          if (!appProfile) {
            let nameForNewProfile = 'New User'; // Default if no displayName
            if (fbUser.displayName && fbUser.displayName.trim() !== '') {
              nameForNewProfile = fbUser.displayName.trim();
            } else if (fbUser.email) {
              nameForNewProfile = fbUser.email.split('@')[0]; // Fallback to email prefix if no displayName
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
          
          if (appProfile) { // If profile fetched or created, update user context
            setUser({
              id: appProfile.id,
              name: appProfile.name,
              avatarUrl: appProfile.avatarUrl,
            });
          }
        } catch (profileError) {
          console.error("Error fetching/creating app profile in useAuth:", profileError);
          // User context still has basic info from Firebase.
        }
        // setLoading(false) was moved up
      } else {
        setUser(null);
        setLoading(false); 
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    // setLoading(true); // onAuthStateChanged will handle this
    await signInWithEmailAndPassword(auth, email, pass);
    router.push('/');
  };

  const signup = async (email: string, pass: string, name: string) => {
    // setLoading(true); // onAuthStateChanged will handle this
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    if (fbUser) {
      const profileData: UserProfile = {
        id: fbUser.uid,
        name: name, 
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || `https://placehold.co/40x40.png?text=${name.substring(0,1).toUpperCase()}`,
        isOnline: false,
        bio: '',
      };
      await createUserProfile(profileData);
      setUser({ // Update local user state immediately
        id: profileData.id,
        name: profileData.name,
        avatarUrl: profileData.avatarUrl,
      });
    }
    router.push('/');
  };

  const logout = async () => {
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
