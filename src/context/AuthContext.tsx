
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getClientServices, type Auth, type Firestore, type FirebaseStorage, type FirebaseApp, type Functions } from '@/lib/firebase';
import { UserPublic } from '@/lib/types';
import { startUserPresence, stopUserPresence } from '@/lib/userPresence';

interface FirebaseServices {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  functions: Functions | null;
}

interface AuthContextType extends FirebaseServices {
  user: User | null;
  userProfile: UserPublic | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  app: null,
  auth: null,
  db: null,
  storage: null,
  functions: null,
  user: null,
  userProfile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize services to prevent re-initialization on every render
  const services = useMemo(() => getClientServices(), []);
  const { auth, db } = services;

  useEffect(() => {
    if (!auth || !db) {
        setLoading(false);
        return;
    }

    const authUnsubscribe = onAuthStateChanged(auth, async (authUser) => {
      let profileUnsubscribe: (() => void) | undefined;

      if (authUser) {
        setUser(authUser);
        startUserPresence(db, authUser);
        
        const userDocRef = doc(db, 'users_public', authUser.uid);
        profileUnsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserProfile({ uid: doc.id, ...doc.data() } as UserPublic);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, () => setLoading(false)); // Handle snapshot errors
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }

      return () => {
        if (profileUnsubscribe) {
            profileUnsubscribe();
        }
      };
    });

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if(auth?.currentUser && db) {
        stopUserPresence(db, auth.currentUser);
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      authUnsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
       if(auth?.currentUser && db) {
        stopUserPresence(db, auth.currentUser);
      }
    };
  }, [auth, db]);

  const value = { ...services, user, userProfile, loading };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div className="flex h-screen items-center justify-center"><p>Loading...</p></div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
