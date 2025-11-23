"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import CallButton from "@/components/CallButton";
import { UserPublic } from "@/lib/types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function HomePage() {
  const { user } = useAuth();
  const { db } = useAuth();
  const [users, setUsers] = useState<UserPublic[]>([]);

  useEffect(() => {
    if (!db) return;

    const unsub = onSnapshot(collection(db, "users_public"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as UserPublic));
      setUsers(list);
    });

    return () => unsub();
  }, [db]);

  if (!user) {
    return (
      <div className="p-6 text-center text-xl">
        Please sign in to see users.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <div className="flex flex-col gap-4">
        {users.map((u) => (
          <div
            key={u.uid}
            className="flex items-center justify-between p-4 border rounded-xl"
          >
             <Link href={`/profile/${u.uid}`} className="flex items-center gap-3">
              <Avatar className="w-12 h-12 rounded-full object-cover">
                 <AvatarImage src={u.photoURL} alt={u.displayName} />
                 <AvatarFallback>{u.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{u.displayName}</p>
                <p className={`text-xs ${u.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                  {u.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </Link>

            {user.uid !== u.uid && (
              <CallButton callerId={user.uid} calleeId={u.uid} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
