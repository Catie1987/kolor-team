// hooks/use-notification-realtime.ts
"use client"
import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export function useNotificationRealtime(myUserId: string | null, onChange: () => void) {
    useEffect(() => {
        if (!myUserId) return;

        const channel = supabaseBrowser
            .channel("notifications-channel")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "notifications", filter: `receiver_id=eq.${myUserId}` },
                () => {
                    onChange();
                }
            )
            .subscribe();

        return () => {
            supabaseBrowser.removeChannel(channel);
        };
    }, [myUserId, onChange]);
}