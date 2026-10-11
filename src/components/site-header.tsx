import Link from "next/link";
import { SearchPalette } from "./search-palette";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-night/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight" aria-label="Airtime home">
          <span className="on-air-dot size-2.5 rounded-full bg-on-air" aria-hidden />
          Airtime
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground" aria-label="Main">
          <Link className="hover:text-foreground" href="/#tonight">Tonight</Link>
          <Link className="hover:text-foreground" href="/watchlist">Watchlist</Link>
        </nav>
        <div className="ml-auto">
          <SearchPalette />
        </div>
      </div>
    </header>
  );
}
