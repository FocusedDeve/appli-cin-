"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LanguageSelect } from "@/components/language-select";
import { SearchLauncher } from "@/components/search-launcher";
import { WatchlistButton } from "@/components/watchlist-drawer";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-3 border-b px-4 transition-colors duration-200 sm:px-8 ${
        scrolled ? "border-line bg-canvas/85" : "border-transparent bg-transparent"
      }`}
    >
      <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap">
        <Image src="/logo.png" alt="" width={36} height={36} priority className="size-8 sm:size-9" />
        <span className="font-display text-xl leading-none text-ink sm:text-2xl">Popcorn &amp; Chill</span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <SearchLauncher />
        <LanguageSelect />
        <WatchlistButton />
      </div>
    </header>
  );
}
