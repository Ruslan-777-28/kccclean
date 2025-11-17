"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getClientServices, type Auth, type Firestore, type FirebaseStorage, type FirebaseApp } from '@/lib/firebase';
import { UserPublic } from '@/lib/types';
import IncomingCallListener from '@/components/IncomingCallListener';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseServices {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
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
    if (!auth) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && db) {
        // Listen to user's public profile
        const userDocRef = doc(db, 'users_public', user.uid);
        const unsubProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data() as UserPublic);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  const value = { ...services, user, userProfile, loading };

  return (
    <AuthContext.Provider value={value}>
      <FirebaseErrorListener />
      {loading ? <div className="flex h-screen items-center justify-center"><p>Loading...</p></div> : children}
      {user && userProfile && <IncomingCallListener />}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
