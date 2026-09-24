// hooks/use-loading-router.ts
"use client";

import { useRouteLoader } from "@/components/provider/router-loader-provider";
import { useRouter } from "next/navigation";


export function useLoadingRouter() {
    const router = useRouter();
    const { start } = useRouteLoader();

    return {
        push: (href: string) => {
            start();
            router.push(href);
        },
        replace: (href: string) => {
            start();
            router.replace(href);
        },
        back: () => {
            start();
            router.back();
        },
        forward: () => {
            start();
            router.forward();
        },
        refresh: () => {
            router.refresh();
        },
    };
}