// components/route-loader-provider.tsx
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const RouteLoaderContext = createContext<{
  loading: boolean;
  start: () => void;
  done: () => void;
}>({ loading: false, start: () => {}, done: () => {} });

export function useRouteLoader() {
  return useContext(RouteLoaderContext);
}

export function RouteLoaderProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  // const searchParams = useSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(false);
    if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;
      if (anchor.target === "_blank" || e.metaKey || e.ctrlKey) return;
      if (href === pathname) return;

      setLoading(true);
      timeoutRef.current = setTimeout(() => setLoading(false), 4000);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  const start = () => setLoading(true);
  const done = () => setLoading(false);

  return (
    <RouteLoaderContext.Provider value={{ loading, start, done }}>
      {children}
    </RouteLoaderContext.Provider>
  );
}