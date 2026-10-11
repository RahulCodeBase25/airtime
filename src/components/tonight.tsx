"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Item = {
  id: number;
  airstamp: string;
  runtime: number;
  season: number;
  number: number | null;
  name: string;
  show: { id: number; name: string; channel: string; weight: number; image: string | null };
};
type Payload = { tv: Item[]; web: Item[] };

const PX_PER_MIN = 4.2;
const ROW_H = 64;
const MIN = 60_000;

const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

type Mode = "now" | "prime";

export function Tonight() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState(false);
  const [clockNow, setNow] = useState<number | null>(null);
  const now = clockNow ?? 0;
  const [mode, setMode] = useState<Mode>("now");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(Date.now());
    fetch(`/api/schedule?date=${localDate()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // The window shown: around now, or tonight's prime time
  const win = useMemo(() => {
    if (mode === "prime") {
      const s = new Date(now);
      s.setHours(18, 30, 0, 0);
      return { start: s.getTime(), end: s.getTime() + 5 * 60 * MIN };
    }
    const start = Math.floor(now / (30 * MIN)) * 30 * MIN - 60 * MIN;
    return { start, end: start + 6 * 60 * MIN };
  }, [mode, now]);

  const rows = useMemo(() => {
    if (!data || !clockNow) return [];
    const inWindow = data.tv
      .map((e) => {
        const start = Date.parse(e.airstamp);
        const end = start + (e.runtime || 30) * MIN;
        return { ...e, start, end };
      })
      .filter((e) => e.end > win.start && e.start < win.end);
    const byChannel = new Map<string, typeof inWindow>();
    for (const e of inWindow) byChannel.set(e.show.channel, [...(byChannel.get(e.show.channel) ?? []), e]);
    return [...byChannel.entries()]
      .map(([channel, eps]) => ({ channel, eps, score: Math.max(...eps.map((e) => e.show.weight)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [data, win, clockNow]);

  // If nothing is on right now (late night), jump to prime time
  useEffect(() => {
    if (data && clockNow && mode === "now" && rows.length < 3) setMode("prime");
  }, [data, clockNow, rows.length, mode]);

  // Scroll so "now" sits near the left edge
  useEffect(() => {
    const el = scroller.current;
    if (!el || !rows.length) return;
    const x = mode === "now" ? ((now - win.start) / MIN) * PX_PER_MIN - 140 : 0;
    el.scrollTo({ left: Math.max(0, x), behavior: "smooth" });
    // only when the data or mode changes, not on every clock tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, mode]);

  const width = ((win.end - win.start) / MIN) * PX_PER_MIN;
  const ticks: number[] = [];
  for (let t = win.start; t <= win.end; t += 30 * MIN) ticks.push(t);
  const nowX = ((now - win.start) / MIN) * PX_PER_MIN;
  const nowVisible = now >= win.start && now <= win.end;

  return (
    <section id="tonight" className="scroll-mt-16 px-5 pt-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[0.95] tracking-tight">
            What's on tonight
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every show airing on US TV today, live from TVmaze. {clockNow ? <>The red line is now: {clock(now)}.</> : null}
          </p>
        </div>
        <div className="flex rounded-full bg-panel p-1 text-sm ring-1 ring-border" role="radiogroup" aria-label="Time window">
          {(["now", "prime"] as const).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-1.5 font-medium transition ${mode === m ? "bg-foreground text-night" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m === "now" ? "Around now" : "Prime time"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-panel ring-1 ring-border">
        {error ? (
          <p className="p-8 text-muted-foreground">Couldn't load today's schedule. Refresh to try again.</p>
        ) : !data || !clockNow ? (
          <div className="space-y-2 p-4" aria-label="Loading schedule">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-panel-2/70" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-muted-foreground">Nothing is scheduled in this window. Try prime time.</p>
        ) : (
          <div className="flex">
            {/* channel names stay put while the grid scrolls */}
            <div className="w-24 shrink-0 border-r border-border sm:w-[132px]">
              <div className="h-9 border-b border-border" />
              {rows.map((r) => (
                <div key={r.channel} className="flex items-center px-3 text-sm font-semibold sm:px-4" style={{ height: ROW_H }}>
                  <span className="truncate">{r.channel}</span>
                </div>
              ))}
            </div>
            <div ref={scroller} className="rail relative overflow-x-auto" tabIndex={0} aria-label="Schedule grid, scroll sideways">
              <div className="relative" style={{ width }}>
                <div className="relative h-9 border-b border-border text-xs text-muted-foreground">
                  {ticks.map((t) => (
                    <span key={t} className="absolute top-2.5 -translate-x-1/2 tabular-nums" style={{ left: ((t - win.start) / MIN) * PX_PER_MIN }}>
                      {t === win.start ? "" : clock(t)}
                    </span>
                  ))}
                </div>
                {rows.map((r) => (
                  <div key={r.channel} className="relative border-b border-border/60 last:border-0" style={{ height: ROW_H }}>
                    {r.eps.map((e) => {
                      const left = Math.max(0, ((e.start - win.start) / MIN) * PX_PER_MIN);
                      const right = Math.min(width, ((e.end - win.start) / MIN) * PX_PER_MIN);
                      const live = now >= e.start && now < e.end;
                      const progress = live ? (now - e.start) / (e.end - e.start) : 0;
                      return (
                        <Link
                          key={e.id}
                          href={`/show/${e.show.id}`}
                          prefetch={false}
                          className={`absolute top-1.5 bottom-1.5 overflow-clip rounded-lg px-3 py-2 transition hover:bg-[#2a4168] ${
                            live ? "bg-panel-2 ring-1 ring-on-air/60" : "bg-panel-2/60"
                          }`}
                          style={{ left: left + 2, width: Math.max(28, right - left - 4) }}
                          title={`${e.show.name}, ${clock(e.start)} to ${clock(e.end)}`}
                        >
                          <span className="sticky left-3 inline-block w-max max-w-[15rem] align-top">
                          <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                            {live && <span className="on-air-dot size-1.5 shrink-0 rounded-full bg-on-air" aria-label="On air" />}
                            {e.show.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {e.number ? `S${e.season} E${e.number}: ` : ""}
                            {e.name}
                          </span>
                          </span>
                          {live && (
                            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-on-air/80" style={{ width: `${progress * 100}%` }} aria-hidden />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
                {nowVisible && (
                  <div className="pointer-events-none absolute inset-y-0 z-10" style={{ left: nowX }} aria-hidden>
                    <div className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-on-air px-2 py-0.5 text-[11px] font-bold text-white">
                      {clock(now)}
                    </div>
                    <div className="absolute top-6 bottom-0 w-0.5 -translate-x-1/2 bg-on-air shadow-[0_0_12px_var(--on-air)]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {data && data.web.length > 0 && <StreamingToday items={data.web} />}
    </section>
  );
}

function StreamingToday({ items }: { items: Item[] }) {
  const shows = [...new Map(items.map((i) => [i.show.id, i])).values()]
    .filter((i) => i.show.image)
    .sort((a, b) => b.show.weight - a.show.weight)
    .slice(0, 16);
  if (!shows.length) return null;
  return (
    <div className="mt-8">
      <h2 className="font-display text-xl font-semibold tracking-tight">New episodes on streaming today</h2>
      <div className="rail mt-4 flex gap-3 overflow-x-auto pb-2" tabIndex={0} aria-label="New on streaming today">
        {shows.map((i) => (
          <Link key={i.id} href={`/show/${i.show.id}`} prefetch={false} className="flex w-72 shrink-0 gap-3 rounded-xl bg-panel p-2 ring-1 ring-border hover:ring-ring">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.show.image!} alt="" className="h-20 w-14 shrink-0 rounded-md object-cover" loading="lazy" />
            <span className="min-w-0 py-1">
              <span className="block truncate font-semibold">{i.show.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{i.show.channel}</span>
              <span className="mt-1 block truncate text-xs">
                {i.number ? `S${i.season} E${i.number}: ` : ""}
                {i.name}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
