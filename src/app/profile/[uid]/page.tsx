"use client";

import { notFound, useParams } from 'next/navigation';
import { getUserProfile, updateUserAvatar } from '@/lib/firestore';
import ProfileCard from '@/components/ProfileCard';
import { UserPublic } from '@/lib/types';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { uploadAvatar } from '@/lib/storage';
import { Loader2 } from 'lucide-react';
import CallButton from '@/components/CallButton';

export default function ProfilePage() {
  const params = useParams();
  const uid = params.uid as string;
  const { user: authUser, db, storage } = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = authUser?.uid === uid;

  useEffect(() => {
    if (!db || !uid) return;
    const fetchUser = async () => {
      setLoading(true);
      const userProfile = await getUserProfile(db, uid);
      setUser(userProfile);
      setLoading(false);
    };
    fetchUser();
  }, [db, uid]);

  const handleAvatarClick = () => {
    if (isOwnProfile && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !authUser || !storage || !db) return;

    setUploading(true);
    toast({ title: 'Завантаження...', description: 'Ваш новий аватар завантажується.' });

    try {
      const newPhotoURL = await uploadAvatar(storage, authUser.uid, file);
      await updateUserAvatar(db, authUser.uid, newPhotoURL);
      
      // Update local state to show new avatar immediately
      setUser(prevUser => prevUser ? { ...prevUser, photoURL: newPhotoURL } : null);

      toast({ title: 'Успіх!', description: 'Ваш аватар успішно оновлено.' });
    } catch (error: any) {
      console.error("Failed to upload avatar:", error);
      toast({
        variant: 'destructive',
        title: 'Помилка завантаження',
        description: error.message || 'Не вдалося оновити аватар. Спробуйте ще раз.',
      });
    } finally {
      setUploading(false);
      // Reset file input value to allow re-uploading the same file
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return <div className="flex h-[70vh] items-center justify-center"><p>Завантаження профілю...</p></div>;
  }
  
  if (!user) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-3xl font-headline font-bold text-primary mb-8">{user.displayName}&apos;s Profile</h1>
      <div className="w-full max-w-sm">
        <ProfileCard 
          user={user as UserPublic} 
          showBio 
          onAvatarClick={isOwnProfile ? handleAvatarClick : undefined}
          isUploading={uploading}
        />
         {!isOwnProfile && authUser && (
            <div className="mt-4 flex justify-center">
              <CallButton callerId={authUser.uid} calleeId={user.uid} />
            </div>
         )}
        {isOwnProfile && (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
            className="hidden"
            disabled={uploading}
          />
        )}
         {isOwnProfile && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Натисніть на аватар, щоб змінити його.
            </p>
          )}
      </div>
    </div>
  );
}
