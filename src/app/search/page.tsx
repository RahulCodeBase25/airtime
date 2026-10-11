import { Suspense } from "react";
import type { Metadata } from "next";
import { searchShows } from "@/lib/tvmaze";
import { Poster } from "@/components/poster";

export const metadata: Metadata = { title: "Search" };

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams;
  const term = (Array.isArray(q) ? q[0] : q ?? "").trim().slice(0, 80);
  if (term.length < 2) return <p className="mt-6 text-muted-foreground">Type a show name in the search box (press / or ⌘K).</p>;
  const shows = await searchShows(term.toLowerCase());
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Results for “{term}”</h1>
      {shows.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No shows match that name. Check the spelling or try fewer words.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
          {shows.map((s) => (
            <Poster key={s.id} show={s} />
          ))}
        </div>
      )}
    </>
  );
}

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="px-5 pt-10 sm:px-8 [&_a]:w-auto">
      <Suspense fallback={<p className="text-muted-foreground">Searching…</p>}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
