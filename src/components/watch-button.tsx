"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useWatchlist, type SavedShow } from "@/store/watchlist";

export function WatchButton({ show }: { show: Omit<SavedShow, "addedAt"> }) {
  const toggle = useWatchlist((s) => s.toggle);
  const saved = useWatchlist((s) => s.shows.some((x) => x.id === show.id));
  // The list lives in localStorage, so wait for the browser before showing state
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const on = ready && saved;

  return (
    <button
      onClick={() => toggle(show)}
      aria-pressed={on}
      className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
        on ? "bg-panel-2 text-foreground ring-1 ring-ring" : "bg-foreground text-night hover:bg-white"
      }`}
    >
      {on ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {on ? "On your watchlist" : "Add to watchlist"}
    </button>
  );
}
