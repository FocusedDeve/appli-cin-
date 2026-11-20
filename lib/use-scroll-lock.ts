"use client";

import { useEffect } from "react";

/** Bloque le défilement de la page tant qu'une modale ou un panneau est ouvert. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
