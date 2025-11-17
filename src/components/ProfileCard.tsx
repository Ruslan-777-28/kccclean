import { UserPublic } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CallButton from "./CallButton";
import Link from "next/link";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ProfileCardProps = {
  user: UserPublic;
  showBio?: boolean;
  onAvatarClick?: () => void;
  isUploading?: boolean;
};

export default function ProfileCard({ user, showBio = false, onAvatarClick, isUploading = false }: ProfileCardProps) {
  const isEditable = !!onAvatarClick;

  return (
    <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div 
          className={cn(
            "relative mx-auto h-24 w-24 mb-4",
            isEditable && "cursor-pointer group"
          )}
          onClick={onAvatarClick}
        >
          <Avatar className="mx-auto h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={user.photoURL} alt={user.displayName} data-ai-hint="person portrait" />
            <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {(isUploading || isEditable) && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <p className="text-white text-xs font-bold text-center">Змінити</p>
              )}
            </div>
          )}
        </div>
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
