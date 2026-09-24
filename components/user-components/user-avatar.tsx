// components/user-avatar.tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ClerkUserSummary } from "@/lib/clerk/clerk-user-cache";
import { Mail } from "lucide-react";

interface UserAvatarProps {
    user?: ClerkUserSummary;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    showName?: boolean;
    showEmail?: boolean;
    className?: string;
}

const sizeClasses = {
    xs: "size-5",
    sm: "size-6",
    md: "size-8",
    lg: "size-10",
    xl: "size-12",
};

export function UserAvatar({ user, size = "sm", showName, showEmail, className }: UserAvatarProps) {
    const name = user?.fullName ?? "Unknown";
    const email = user?.email ?? "Unknown";
    const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <Avatar className={sizeClasses[size]}>
                <AvatarImage src={user?.imageUrl} alt={name} />
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 min-w-0">
                {showName && <span className="text-sm font-medium truncate">{name}</span>}
                {showEmail && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="size-3 shrink-0" />
                    {email}
                </p>
                )}
            </div>
        </div>
    );
}