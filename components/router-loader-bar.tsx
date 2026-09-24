// components/route-loader-bar.tsx
"use client";

import { useRouteLoader } from "./provider/router-loader-provider";
import { cn } from "@/lib/utils";

export function RouteLoaderBar({ className }: { className?: string }) {
  const { loading } = useRouteLoader();

  return (
    <div
      className={cn(
        "absolute top-0 left-0 h-[3px] bg-primary transition-all duration-300 ease-out z-50",
        loading ? "w-full opacity-100" : "w-0 opacity-0",
        className
      )}
      style={{
        transitionDuration: loading ? "2s" : "300ms",
        transitionTimingFunction: loading ? "cubic-bezier(0.1, 0.5, 0.9, 0.5)" : "ease-out",
      }}
    />
  );
}