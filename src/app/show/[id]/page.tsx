import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShow, getPopularIds, plain, channelOf } from "@/lib/tvmaze";
import { WatchButton } from "@/components/watch-button";
import { Seasons, type Ep } from "@/components/seasons";
import { Countdown, LocalTime } from "@/components/countdown";

export async function generateStaticParams() {
  const ids = await getPopularIds();
  return ids.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({ params }: PageProps<"/show/[id]">): Promise<Metadata> {
  const { id } = await params;
  const show = Number(id) ? await getShow(Number(id)) : null;
  if (!show) return { title: "Show not found" };
  return { title: show.name, description: plain(show.summary).slice(0, 160) };
}

async function ShowDetails({ params }: Pick<PageProps<"/show/[id]">, "params">) {
  const { id } = await params;
  const show = Number(id) ? await getShow(Number(id)) : null;
  if (!show) notFound();

  const images = show._embedded.images ?? [];
  const backdrop =
    images.find((i) => i.type === "background" && i.main) ?? images.find((i) => i.type === "background") ?? images.find((i) => i.type === "banner");
  const next = show._embedded.nextepisode;
  const years = show.premiered ? `${show.premiered.slice(0, 4)}–${show.ended ? show.ended.slice(0, 4) : show.status === "Running" ? "now" : ""}` : null;
  const episodes: Ep[] = (show._embedded.episodes ?? []).map((e) => ({
    id: e.id,
    season: e.season,
    number: e.number,
    name: e.name,
    airdate: e.airdate,
    runtime: e.runtime,
    rating: e.rating.average,
    image: e.image?.medium ?? null,
    summary: plain(e.summary).slice(0, 260),
  }));
  const cast = (show._embedded.cast ?? []).slice(0, 16);

  return (
    <article>
      {/* backdrop fades into the page */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[460px] overflow-hidden" aria-hidden>
          {backdrop && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backdrop.resolutions.original.url} alt="" className="size-full object-cover object-top opacity-45" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-night/30 via-night/70 to-night" />
          <div className="absolute inset-0 bg-gradient-to-r from-night via-night/40 to-transparent" />
        </div>

        <div className="relative grid gap-8 px-5 pt-14 sm:px-8 md:grid-cols-[240px_1fr] md:pt-24">
          <div className="mx-auto w-48 md:mx-0 md:w-full">
            {show.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={show.image.original} alt={`${show.name} poster`} className="w-full rounded-xl shadow-2xl shadow-black/50 ring-1 ring-border" />
            )}
          </div>
          <div className="max-w-3xl">
            <p className="text-sm text-muted-foreground">
              {[channelOf(show), years, show.averageRuntime ? `${show.averageRuntime} min episodes` : null].filter(Boolean).join(", ")}
            </p>
            <h1 className="mt-2 font-display text-[clamp(2.4rem,6vw,4.6rem)] font-extrabold leading-[0.92] tracking-tight">{show.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {show.rating.average ? (
                <span className="rounded-md bg-foreground px-2 py-0.5 text-sm font-bold tabular-nums text-night">
                  {show.rating.average.toFixed(1)}
                </span>
              ) : null}
              {show.genres.map((g) => (
                <span key={g} className="rounded-md bg-panel px-2 py-0.5 text-sm ring-1 ring-border">
                  {g}
                </span>
              ))}
              <span className={`rounded-md px-2 py-0.5 text-sm ring-1 ${show.status === "Running" ? "text-[#7ee2a8] ring-[#7ee2a8]/40" : "text-muted-foreground ring-border"}`}>
                {show.status === "Running" ? "Still airing" : show.status}
              </span>
            </div>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-foreground/85">{plain(show.summary) || "No description yet."}</p>

            {next?.airstamp && (
              <div className="mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-panel px-4 py-3 ring-1 ring-border">
                <span className="on-air-dot size-2 rounded-full bg-on-air" aria-hidden />
                <span className="font-semibold">
                  Next: S{next.season} E{next.number ?? "?"}, {next.name}
                </span>
                <span className="text-muted-foreground">
                  <LocalTime iso={next.airstamp} /> (<Countdown to={next.airstamp} />)
                </span>
              </div>
            )}

            <div className="mt-6">
              <WatchButton show={{ id: show.id, name: show.name, image: show.image?.medium ?? null, channel: channelOf(show) }} />
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16 px-5 sm:px-8" aria-labelledby="episodes">
        <h2 id="episodes" className="mb-4 font-display text-2xl font-semibold tracking-tight">
          Episodes <span className="text-muted-foreground">{episodes.length}</span>
        </h2>
        <Seasons episodes={episodes} />
      </section>

      {cast.length > 0 && (
        <section className="mt-16" aria-labelledby="cast">
          <h2 id="cast" className="px-5 font-display text-2xl font-semibold tracking-tight sm:px-8">
            Cast
          </h2>
          <ul className="rail mt-4 flex gap-4 overflow-x-auto px-5 pb-2 sm:px-8" tabIndex={0} aria-label="Cast">
            {cast.map((c) => (
              <li key={`${c.person.id}-${c.character.id}`} className="w-32 shrink-0">
                <div className="aspect-square overflow-hidden rounded-full bg-panel ring-1 ring-border">
                  {(c.person.image ?? c.character.image) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(c.person.image ?? c.character.image)!.medium} alt="" loading="lazy" className="size-full object-cover" />
                  )}
                </div>
                <p className="mt-2 text-center text-sm font-semibold leading-tight">{c.person.name}</p>
                <p className="text-center text-xs text-muted-foreground">{c.character.name}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function ShowSkeleton() {
  return (
    <div className="grid gap-8 px-5 pt-14 sm:px-8 md:grid-cols-[240px_1fr] md:pt-24" aria-label="Loading show">
      <div className="mx-auto aspect-[2/3] w-48 animate-pulse rounded-xl bg-panel md:w-full" />
      <div className="space-y-4">
        <div className="h-4 w-48 rounded bg-panel" />
        <div className="h-14 w-3/4 rounded bg-panel" />
        <div className="h-24 w-full max-w-2xl rounded bg-panel" />
      </div>
    </div>
  );
}

export default function ShowPage(props: PageProps<"/show/[id]">) {
  return (
    <Suspense fallback={<ShowSkeleton />}>
      <ShowDetails params={props.params} />
    </Suspense>
  );
}
