"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getClientServices, type Auth, type Firestore, type FirebaseStorage, type FirebaseApp, type Functions } from '@/lib/firebase';
import { UserPublic } from '@/lib/types';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
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
  
  const services = getClientServices();
  const { auth, db } = services;

  useEffect(() => {
    if (!auth || !db) {
        setLoading(false);
        return;
    }
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      let profileUnsubscribe: (() => void) | undefined;

      if (user) {
        setUser(user);
        startUserPresence(db, user);
        
        const userDocRef = doc(db, 'users_public', user.uid);
        profileUnsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserProfile({ uid: doc.id, ...doc.data() } as UserPublic);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
      } else {
        if(auth.currentUser) {
            stopUserPresence(db, auth.currentUser);
        }
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }

      return () => {
        if (profileUnsubscribe) {
            profileUnsubscribe();
        }
        // This logic was slightly flawed, we need to ensure we have a user to stop presence for.
        // It's better to handle this on user state change.
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
      <FirebaseErrorListener />
      {loading ? <div className="flex h-screen items-center justify-center"><p>Loading...</p></div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
