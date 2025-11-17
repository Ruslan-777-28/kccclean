"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserPublic } from '@/lib/types';
import IncomingCallListener from '@/components/IncomingCallListener';

interface AuthContextType {
  user: User | null;
  userProfile: UserPublic | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {loading ? <div className="flex h-screen items-center justify-center"><p>Loading...</p></div> : children}
      {user && userProfile && <IncomingCallListener />}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
