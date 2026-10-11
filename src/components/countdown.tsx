"use client";

import { useEffect, useState } from "react";

// "in 3 days" style countdown that keeps ticking, rendered only in the browser
export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  if (now == null) return null;
  return <>{relative(Date.parse(to) - now)}</>;
}

export function relative(ms: number) {
  if (ms <= 0) return "airing now";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

export function LocalTime({ iso, withDay = true }: { iso: string; withDay?: boolean }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(
      new Date(iso).toLocaleString([], withDay ? { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" } : { hour: "numeric", minute: "2-digit" })
    );
  }, [iso, withDay]);
  return <>{text}</>;
}
