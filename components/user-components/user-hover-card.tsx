"use client"
import { useRouter } from "next/navigation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { formatUsername } from "@/lib/helper";
import { format } from "date-fns";
import { Button } from "../ui/button";
import {UserAvatar} from "@/components/user-components/user-avatar"
import { cn } from "@/lib/utils";

interface UserHoverCardProps {
    creator?: { id: string; fullName: string; email: string; imageUrl: string };
    dateValue?: string;
    className?: string;
}


export function UserHoverCard({ creator, dateValue, className }: UserHoverCardProps) {
  const router = useRouter();

    if (!creator) return null;

    const initials = creator.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
  return (
    <HoverCard>
      <HoverCardTrigger
        className={cn(
          "text-xs italic font-medium hover:underline cursor-pointer",
          className
          )}
        render={
          <Button variant="link"
          onClick={() => router.push(`/dashboard/profile/${creator.id}`)}
          className="text-foreground px-0"
          >
            {formatUsername(creator.fullName)}
          </Button>
        }
      />
      <HoverCardContent className="w-72">
        <div className="flex flex-col gap-2">
          <UserAvatar
            user={creator}
            size="lg"
            showName
            showEmail
          />
          {dateValue && (
            <span className="text-xs text-muted-foreground ml-12">
              {format(dateValue, "dd-MMM-yyyy")}
            </span>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}