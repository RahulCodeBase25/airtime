import { cacheLife } from "next/cache";

// Thin, typed wrapper around the free TVmaze API (https://www.tvmaze.com/api).
// Every call is cached with Next.js "use cache", so a page view doesn't hit
// TVmaze again until the cache expires (TVmaze allows ~20 calls per 10 s).

const API = "https://api.tvmaze.com";

export type Image = { medium: string; original: string } | null;

export type Show = {
  id: number;
  name: string;
  type: string;
  language: string | null;
  genres: string[];
  status: string;
  runtime: number | null;
  averageRuntime: number | null;
  premiered: string | null;
  ended: string | null;
  rating: { average: number | null };
  weight: number;
  network: { name: string; country: { code: string } | null } | null;
  webChannel: { name: string } | null;
  image: Image;
  summary: string | null;
  schedule: { time: string; days: string[] };
  officialSite: string | null;
};

export type Episode = {
  id: number;
  name: string;
  season: number;
  number: number | null;
  airdate: string;
  airstamp: string | null;
  runtime: number | null;
  rating: { average: number | null };
  image: Image;
  summary: string | null;
};

export type CastMember = {
  person: { id: number; name: string; image: Image };
  character: { id: number; name: string; image: Image };
};

export type ShowDetails = Show & {
  _embedded: {
    cast: CastMember[];
    episodes: Episode[];
    images: { type: string; main: boolean; resolutions: { original: { url: string }; medium?: { url: string } } }[];
    nextepisode?: Episode;
  };
};

export type ScheduleItem = Episode & { show: Show };

async function get<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API}${path}`, { headers: { accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TVmaze ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

export const plain = (html: string | null) =>
  (html ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

export const channelOf = (s: Pick<Show, "network" | "webChannel">) => s.network?.name ?? s.webChannel?.name ?? "Unknown";

// ---------- Show pages ----------

export async function getShow(id: number) {
  "use cache";
  cacheLife("hours");
  return get<ShowDetails>(
    `/shows/${id}?embed[]=cast&embed[]=episodes&embed[]=images&embed[]=nextepisode`
  );
}

export async function searchShows(q: string) {
  "use cache";
  cacheLife("hours");
  const hits = await get<{ score: number; show: Show }[]>(`/search/shows?q=${encodeURIComponent(q)}`);
  return (hits ?? []).map((h) => h.show);
}

// ---------- Schedules ----------

// Everything airing on US TV and US streaming services on a given day
export async function getSchedule(date: string) {
  "use cache";
  cacheLife("hours");
  const [tv, web] = await Promise.all([
    get<ScheduleItem[]>(`/schedule?country=US&date=${date}`),
    get<(Episode & { _embedded: { show: Show } })[]>(`/schedule/web?date=${date}&country=US`),
  ]);
  return {
    tv: tv ?? [],
    web: (web ?? []).map(({ _embedded, ...ep }) => ({ ...ep, show: _embedded.show })) as ScheduleItem[],
  };
}

// ---------- Browse rails ----------

// TVmaze has no "popular" endpoint, so we build rails from two sources:
// shows airing this week (fresh) and the first pages of the show index
// (mostly long-running classics), ranked by TVmaze's popularity weight.

const unique = (shows: Show[]) => [...new Map(shows.map((s) => [s.id, s])).values()];

export async function getAiringThisWeek() {
  "use cache";
  cacheLife("hours");
  const today = new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const schedules = await Promise.all(days.map((d) => getSchedule(d)));
  const shows = schedules.flatMap((s) => [...s.tv, ...s.web].map((e) => e.show));
  return unique(shows)
    .filter((s) => s.image && s.weight >= 85 && s.language === "English")
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 24);
}

export async function getCatalog() {
  "use cache";
  cacheLife("days");
  const pages = await Promise.all([0, 1, 2, 3].map((p) => get<Show[]>(`/shows?page=${p}`)));
  return unique(pages.flatMap((p) => p ?? [])).filter((s) => s.image && s.rating.average && s.language === "English");
}

export async function getRails() {
  "use cache";
  cacheLife("days");
  const all = await getCatalog();
  const byRating = (list: Show[]) =>
    [...list].sort((a, b) => (b.rating.average ?? 0) - (a.rating.average ?? 0) || b.weight - a.weight);
  const popular = all.filter((s) => s.weight >= 90);
  const genre = (g: string) => byRating(popular.filter((s) => s.genres.includes(g))).slice(0, 18);
  return [
    { title: "The all-time greats", shows: byRating(popular).slice(0, 18) },
    { title: "Drama worth your weekend", shows: genre("Drama") },
    { title: "Comedy to put on tonight", shows: genre("Comedy") },
    { title: "Science fiction", shows: genre("Science-Fiction") },
    { title: "Crime", shows: genre("Crime") },
  ].filter((r) => r.shows.length >= 6);
}

export async function getPopularIds() {
  "use cache";
  cacheLife("days");
  const all = await getCatalog();
  return all
    .filter((s) => s.weight >= 95)
    .slice(0, 20)
    .map((s) => s.id);
}
