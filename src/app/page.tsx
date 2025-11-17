import { getAllUsers } from "@/lib/firestore";
import ProfileCard from "@/components/ProfileCard";
import { UserPublic } from "@/lib/types";

export default async function Home() {
  const users = await getAllUsers();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-headline font-bold text-primary mb-4">
        Welcome to ConnectNow
      </h1>
      <p className="text-lg text-muted-foreground mb-12">
        The future of 1-on-1 real-time communication.
      </p>

      <div className="mb-12">
        <h2 className="text-2xl font-headline font-semibold text-primary mb-6">
          Connect with others
        </h2>
        {users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {users.map((user) => (
              <ProfileCard key={user.uid} user={user as UserPublic} />
            ))}
          </div>
        ) : (
          <p>No users found. Be the first to sign up!</p>
        )}
      </div>
    </div>
  );
}
