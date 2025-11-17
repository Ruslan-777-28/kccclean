'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { signOutUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, User as UserIcon, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Logo from '../Logo';

export default function Header() {
  const { user, userProfile, loading, auth } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    if (!auth) return;
    await signOutUser(auth);
    router.push('/login');
  };

  return (
    <header className="bg-card shadow-sm sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav>
          {loading ? (
            <div className="h-10 w-20 bg-muted rounded-md animate-pulse" />
          ) : user && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName} />
                    <AvatarFallback>{userProfile.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`/profile/${user.uid}`)}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn />
                  Login
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  <UserPlus />
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
