import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { SearchLauncher } from "@/components/search-launcher";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-gradient-to-b from-gray-950/90 to-transparent px-6 py-4 sm:px-12 lg:px-20">
      <Link href="/" className="font-display flex items-center gap-2 text-xl font-bold">
        <Clapperboard className="size-6 text-blue-600" />
        Cinehub
      </Link>
      <SearchLauncher />
    </header>
  );
}
