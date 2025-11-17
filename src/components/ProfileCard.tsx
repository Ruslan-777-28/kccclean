import { UserPublic } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CallButton from "./CallButton";
import Link from "next/link";
import { Button } from "./ui/button";

type ProfileCardProps = {
  user: UserPublic;
  showBio?: boolean;
};

export default function ProfileCard({ user, showBio = false }: ProfileCardProps) {
  return (
    <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <Avatar className="mx-auto h-24 w-24 mb-4 border-4 border-primary/20">
          <AvatarImage src={user.photoURL} alt={user.displayName} data-ai-hint="person portrait" />
          <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <CardTitle className="font-headline">{user.displayName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showBio && (
           <p className="text-muted-foreground">A passionate member of the ConnectNow community. Ready to connect and collaborate!</p>
        )}
        <div className="flex flex-col gap-2">
            <CallButton calleeId={user.uid} calleeName={user.displayName} />
            {!showBio && (
                <Button asChild variant="outline">
                    <Link href={`/profile/${user.uid}`}>View Profile</Link>
                </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
