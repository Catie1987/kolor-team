"use client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserRound, LogOutIcon, Settings, Bell, NotepadText, Wallet } from "lucide-react"
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useRouteLoader } from "./provider/router-loader-provider";
import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";
import { getCurrentSupabaseUserId } from "@/lib/actions/users";
import { useNotificationRealtime } from "@/hooks/use-notification-realtime";

export function UserTab() {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();
    const { start } = useRouteLoader();
    const [unreadCount, setUnreadCount] = useState(0);
    const [mySupabaseId, setMySupabaseId] = useState<string | null>(null);

    useEffect(() => {
        if (isLoaded && user) {
            getUnreadNotificationCount().then(setUnreadCount);
            getCurrentSupabaseUserId().then(setMySupabaseId);
        }
    }, [isLoaded, user]);

    const refetchUnread = () => {
        getUnreadNotificationCount().then(setUnreadCount);
    };

    useNotificationRealtime(mySupabaseId, refetchUnread);

    if (!isLoaded || !user) return null;
    
    
    const handleSignOut = () => {
        // signOut() clears the session; redirectUrl sends them to the home page after
        signOut({ redirectUrl: "/" });
    };
    return (
        <div className="ml-auto">
            <DropdownMenu>
                <DropdownMenuTrigger render={
                    <button className="flex items-center gap-2 sm:hover:bg-muted py-1 px-2 rounded-lg relative group">
                        <Avatar className="">
                            <AvatarImage src={user.imageUrl} alt={user.fullName ?? ""} />
                            <AvatarFallback className="rounded-lg">K</AvatarFallback>
                        </Avatar>
                         <div className="grid flex-1 text-left text-sm leading-tight select-none hidden sm:flex sm:flex-col ">
                            <span className="truncate font-medium">{user.fullName}</span>
                            <span className="truncate text-xs">{user.primaryEmailAddress?.emailAddress}</span>
                        </div>
                        {unreadCount > 0 && (
                        <span className="absolute animate-bounce bg-primary outline-2 outline-background sm:group-hover:outline-muted w-2.5 h-2.5 aspect-square rounded-full bottom-1.5 left-8"/>
                        )}
                    </button>
                }/>
                <DropdownMenuContent 
                    align="end"
                    className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                    >
                    <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                            <Avatar className="">
                                <AvatarImage src={user.imageUrl} alt={user.fullName ?? ""} />
                                <AvatarFallback className="rounded-lg">K</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight select-none">
                                <span className="truncate font-medium">{user.fullName}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user.primaryEmailAddress?.emailAddress}
                                </span>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem onClick={() => {
                        start();
                        router.push("/dashboard/instruction")}}>
                        <NotepadText />
                        Instruction & Guide
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                                start(); 
                                router.push(`/dashboard/profile/${user.id}`);
                        }}>
                            <UserRound />
                            View public profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            start();
                            router.push("/dashboard/profile/notifications");
                        }}>
                            <Bell />
                            Notifications
                            {unreadCount > 0 && (
                                <div className="bg-primary aspect-square h-6 w-6 rounded-full flex items-center justify-center ml-auto">
                                    <span className="font-mono text-xs !text-white"> {unreadCount > 99 ? "99+" : unreadCount}</span>
                                </div>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            start();
                            router.push("/dashboard/profile/payroll");
                        }}>
                            <Wallet />
                            Balance & Payroll
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            start();
                            router.push("/dashboard/profile")
                            }}>
                            <Settings />
                            Settings & Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                            <LogOutIcon />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
