import type { Metadata } from "next";
import { WatchlistView } from "@/components/watchlist-view";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return (
    <div className="px-5 pt-10 sm:px-8">
      <h1 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold tracking-tight">Your watchlist</h1>
      <p className="mt-2 text-muted-foreground">Shows you saved, with the next episode for each. Saved in this browser.</p>
      <WatchlistView />
    </div>
  );
}
