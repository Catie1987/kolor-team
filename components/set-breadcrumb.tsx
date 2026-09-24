// components/set-breadcrumb.tsx
"use client";

import { useEffect } from "react";
import { useBreadcrumbContext } from "./provider/breadcrumb-provider";

export function SetBreadcrumb({ segment, label }: { segment: string; label: string }) {
  const { setOverride } = useBreadcrumbContext();

  useEffect(() => {
    setOverride(segment, label);
  }, [segment, label, setOverride]);

  return null;
}