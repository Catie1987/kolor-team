import { useEffect, useState } from "react";

export function useCompact(
  ref: React.RefObject<HTMLElement | null>,
  breakpoint = 760
) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setIsCompact(entry.contentRect.width < breakpoint);
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, breakpoint]);

  return isCompact;
}