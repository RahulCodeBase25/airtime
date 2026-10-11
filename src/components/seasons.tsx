"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Ep = {
  id: number;
  season: number;
  number: number | null;
  name: string;
  airdate: string;
  runtime: number | null;
  rating: number | null;
  image: string | null;
  summary: string;
};

const fmtDate = (d: string) =>
  d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Date TBA";

export function Seasons({ episodes }: { episodes: Ep[] }) {
  const seasons = [...new Set(episodes.map((e) => e.season))].sort((a, b) => a - b);
  if (!seasons.length) return <p className="text-muted-foreground">No episodes listed yet.</p>;
  // Open on the newest season that has already aired
  const today = new Date().toISOString().slice(0, 10);
  const aired = seasons.filter((s) => episodes.some((e) => e.season === s && e.airdate && e.airdate <= today));
  const initial = String(aired.at(-1) ?? seasons[0]);

  return (
    <Tabs defaultValue={initial}>
      <TabsList variant="line" className="rail h-auto! w-full justify-start overflow-x-auto pb-2">
        {seasons.map((s) => (
          <TabsTrigger key={s} value={String(s)} className="flex-none px-3 text-sm">
            Season {s}
          </TabsTrigger>
        ))}
      </TabsList>
      {seasons.map((s) => (
        <TabsContent key={s} value={String(s)} className="mt-4">
          <ol className="grid gap-3 lg:grid-cols-2">
            {episodes
              .filter((e) => e.season === s)
              .map((e) => (
                <li key={e.id} className="flex gap-4 rounded-xl bg-panel p-3 ring-1 ring-border">
                  <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-panel-2 sm:w-44">
                    {e.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.image} alt="" loading="lazy" className="size-full object-cover" />
                    )}
                    {e.number != null && (
                      <span className="absolute bottom-1 left-1 rounded bg-night/85 px-1.5 text-xs font-semibold tabular-nums">E{e.number}</span>
                    )}
                  </div>
                  <div className="min-w-0 py-0.5">
                    <p className="font-semibold leading-snug">{e.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {fmtDate(e.airdate)}
                      {e.runtime ? `, ${e.runtime} min` : ""}
                      {e.rating ? `, rated ${e.rating.toFixed(1)}` : ""}
                    </p>
                    {e.summary && <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{e.summary}</p>}
                  </div>
                </li>
              ))}
          </ol>
        </TabsContent>
      ))}
    </Tabs>
  );
}
