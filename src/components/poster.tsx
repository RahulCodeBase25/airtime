import Link from "next/link";
import type { Show } from "@/lib/tvmaze";
import { channelOf } from "@/lib/tvmaze";

export function Poster({ show, size = "md", priority = false }: { show: Show; size?: "md" | "lg"; priority?: boolean }) {
  const w = size === "lg" ? "w-44 sm:w-52" : "w-32 sm:w-40";
  return (
    <Link href={`/show/${show.id}`} className={`group shrink-0 ${w} snap-start`} prefetch={false}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-panel ring-1 ring-border transition group-hover:ring-ring group-focus-visible:ring-ring">
        {show.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={show.image.medium}
            alt=""
            loading={priority ? "eager" : "lazy"}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center p-3 text-center font-display text-lg text-muted-foreground">{show.name}</div>
        )}
        {show.rating.average ? (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-night/85 px-1.5 py-0.5 text-xs font-semibold tabular-nums backdrop-blur">
            {show.rating.average.toFixed(1)}
          </span>
        ) : null}
      </div>
      <p className="mt-2 truncate text-sm font-medium">{show.name}</p>
      <p className="truncate text-xs text-muted-foreground">{channelOf(show)}</p>
    </Link>
  );
}

export function Rail({ title, shows, size }: { title: string; shows: Show[]; size?: "md" | "lg" }) {
  if (!shows.length) return null;
  return (
    <section className="mt-12">
      <h2 className="px-5 font-display text-xl font-semibold tracking-tight sm:px-8 sm:text-2xl">{title}</h2>
      <div className="rail mt-4 flex snap-x gap-4 overflow-x-auto px-5 pb-2 sm:px-8" tabIndex={0} aria-label={title}>
        {shows.map((s, i) => (
          <Poster key={s.id} show={s} size={size} priority={i < 6} />
        ))}
      </div>
    </section>
  );
}
