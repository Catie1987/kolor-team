// components/breadcrumb-provider.tsx
"use client";

import { createContext, useContext, useState } from "react";

type Overrides = Record<string, string>;

const BreadcrumbContext = createContext<{
  overrides: Overrides;
  setOverride: (segment: string, label: string) => void;
}>({ overrides: {}, setOverride: () => {} });

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>({});

  const setOverride = (segment: string, label: string) => {
    setOverrides((prev) => (prev[segment] === label ? prev : { ...prev, [segment]: label }));
  };

  return (
    <BreadcrumbContext.Provider value={{ overrides, setOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}