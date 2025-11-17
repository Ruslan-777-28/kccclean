"use client";

import { notFound, useParams } from 'next/navigation';
import { getUserProfile } from '@/lib/firestore';
import ProfileCard from '@/components/ProfileCard';
import { UserPublic } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const params = useParams();
  const uid = params.uid as string;
  const { db } = useAuth();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !uid) return;
    const fetchUser = async () => {
      const userProfile = await getUserProfile(db, uid);
      setUser(userProfile);
      setLoading(false);
    };
    fetchUser();
  }, [db, uid]);

  if (loading) {
    return <div className="flex h-[70vh] items-center justify-center"><p>Loading profile...</p></div>;
  }
  
  if (!user) {
    notFound();
  }
  
  // The metadata generation has been removed as it requires a server component
  // and we've converted this to a client component.
  // A different approach would be needed for dynamic metadata here.

  return (
    <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-headline font-bold text-primary mb-8">{user.displayName}&apos;s Profile</h1>
        <div className="w-full max-w-sm">
            <ProfileCard user={user as UserPublic} showBio />
        </div>
    </div>
  );
}
