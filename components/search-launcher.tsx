"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { useT } from "@/lib/use-lang";

export function SearchLauncher() {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.searchAria}
        className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-sm text-ink-2 transition-colors duration-150 hover:bg-elevated hover:text-ink"
      >
        <Search className="size-4" />
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-sans text-xs text-ink-2 md:inline">Ctrl K</kbd>
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}
