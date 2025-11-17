"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { UserPublic } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const { db, user: currentUser } = useAuth();

  useEffect(() => {
    if (!db) return;

    const usersRef = collection(db, "users_public");
    const q = query(usersRef, orderBy("lastActive", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: UserPublic[] = snapshot.docs
        .map((doc) => ({ uid: doc.id, ...doc.data() } as UserPublic))
        .filter((user) => user.uid !== currentUser?.uid); // Exclude current user
      setUsers(list);
    });

    return () => unsub();
  }, [db, currentUser]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-primary font-headline">
        Available Users
      </h1>

      {users.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map((user) => (
            <Link key={user.uid} href={`/profile/${user.uid}`} passHref>
              <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                <CardContent className="p-6 flex-grow flex flex-col items-center">
                  <div className="relative mb-4">
                    <Avatar className="mx-auto h-24 w-24 border-4 border-primary/20">
                      <AvatarImage src={user.photoURL} alt={user.displayName} data-ai-hint="person portrait" />
                      <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute bottom-1 right-1 block h-4 w-4 rounded-full border-2 border-white ${
                        user.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                      title={user.isOnline ? "Online" : "Offline"}
                    />
                  </div>
                  <h2 className="text-lg font-semibold font-headline text-primary">
                    {user.displayName || "User"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {user.isOnline ? "Online" : "Offline"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
            <p className="text-muted-foreground">No other users are currently available.</p>
        </div>
      )}
    </div>
  );
}
