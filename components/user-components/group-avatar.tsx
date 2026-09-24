// components/group-avatar.tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ClerkUserSummary } from "@/lib/clerk/clerk-user-cache";

interface GroupAvatarProps {
    users: ClerkUserSummary[];
    max?: number;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeClasses = {
    xs: "size-5",
    sm: "size-6",
    md: "size-8",
    lg: "size-10",
    xl: "size-12",
};

const textClasses = {
    xs: "text-[10px]",
    sm: "text-[12px]",
    md: "text-[14px]",
    lg: "text-[15px]",
    xl: "size-[16px]",
}

export function GroupAvatar({ users, max = 4, size = "sm", className }: GroupAvatarProps) {
    const visible = users.slice(0, max);
    const overflow = users.length - visible.length;

    return (
        <div className={cn("flex items-center -space-x-2", className)}>
            {visible.map((user) => {
                const initials = user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                return (
                    <Avatar key={user.id} className={cn(sizeClasses[size], "ring-2 ring-background")}>
                        <AvatarImage src={user.imageUrl} alt={user.fullName} />
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                );
            })}
            {overflow > 0 && (
                <div
                    className={cn(
                        sizeClasses[size],
                        textClasses[size],
                        "rounded-full bg-muted ring-2 ring-background flex items-center justify-center font-medium text-muted-foreground z-1 select-none"
                    )}
                >
                    +{overflow}
                </div>
            )}
        </div>
    );
}