import { notFound } from 'next/navigation';
import { getUserProfile } from '@/lib/firestore';
import ProfileCard from '@/components/ProfileCard';
import { UserPublic } from '@/lib/types';
import { Metadata } from 'next';

type Props = {
  params: { uid: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getUserProfile(params.uid);
  if (!user) {
    return {
      title: 'User Not Found',
    };
  }
  return {
    title: `${user.displayName}'s Profile | ConnectNow`,
  };
}

export default async function ProfilePage({ params }: { params: { uid:string } }) {
  const user = await getUserProfile(params.uid);

  if (!user) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-headline font-bold text-primary mb-8">{user.displayName}&apos;s Profile</h1>
        <div className="w-full max-w-sm">
            <ProfileCard user={user as UserPublic} showBio />
        </div>
    </div>
  );
}
