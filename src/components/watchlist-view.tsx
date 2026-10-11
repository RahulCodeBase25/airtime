"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useWatchlist } from "@/store/watchlist";
import { Countdown, LocalTime } from "./countdown";

type Upcoming = { id: number; status: string; next: { airstamp: string | null; season: number; number: number | null; name: string } | null };

export function WatchlistView() {
  const shows = useWatchlist((s) => s.shows);
  const remove = useWatchlist((s) => s.remove);
  const [ready, setReady] = useState(false);
  const [upcoming, setUpcoming] = useState<Record<number, Upcoming>>({});
  useEffect(() => setReady(true), []);

  const ids = shows.map((s) => s.id).join(",");
  useEffect(() => {
    if (!ids) return;
    fetch(`/api/upcoming?ids=${ids}`)
      .then((r) => r.json())
      .then((list: Upcoming[]) => setUpcoming(Object.fromEntries(list.map((u) => [u.id, u]))))
      .catch(() => {});
  }, [ids]);

  // Shows with a known next episode first, soonest first
  const sorted = useMemo(
    () =>
      [...shows].sort((a, b) => {
        const ta = upcoming[a.id]?.next?.airstamp ? Date.parse(upcoming[a.id]!.next!.airstamp!) : Infinity;
        const tb = upcoming[b.id]?.next?.airstamp ? Date.parse(upcoming[b.id]!.next!.airstamp!) : Infinity;
        return ta - tb || b.addedAt - a.addedAt;
      }),
    [shows, upcoming]
  );

  if (!ready) return null;
  if (!shows.length)
    return (
      <div className="mt-10 rounded-2xl bg-panel p-8 ring-1 ring-border">
        <p className="font-semibold">Nothing saved yet.</p>
        <p className="mt-1 text-muted-foreground">
          Open any show and press “Add to watchlist”. Start with{" "}
          <Link href="/#tonight" className="underline underline-offset-2">
            what's on tonight
          </Link>
          .
        </p>
      </div>
    );

  return (
    <ul className="mt-8 grid gap-3 md:grid-cols-2">
      {sorted.map((s) => {
        const u = upcoming[s.id];
        return (
          <li key={s.id} className="relative flex gap-4 rounded-2xl bg-panel p-3 ring-1 ring-border">
            <Link href={`/show/${s.id}`} className="shrink-0">
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="h-28 w-20 rounded-lg object-cover" />
              ) : (
                <span className="block h-28 w-20 rounded-lg bg-panel-2" />
              )}
            </Link>
            <div className="min-w-0 py-1 pr-8">
              <Link href={`/show/${s.id}`} className="font-display text-lg font-semibold hover:underline">
                {s.name}
              </Link>
              <p className="text-sm text-muted-foreground">{s.channel}</p>
              <p className="mt-2 text-sm">
                {!u ? (
                  <span className="text-muted-foreground">Checking the schedule…</span>
                ) : u.next?.airstamp ? (
                  <>
                    <span className="font-semibold text-foreground">
                      S{u.next.season} E{u.next.number ?? "?"} <Countdown to={u.next.airstamp} />
                    </span>
                    <span className="block text-muted-foreground">
                      <LocalTime iso={u.next.airstamp} />
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{u.status === "Ended" ? "Finished, all episodes out" : "No new episode announced"}</span>
                )}
              </p>
            </div>
            <button onClick={() => remove(s.id)} className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-panel-2 hover:text-foreground" aria-label={`Remove ${s.name}`}>
              <X className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
