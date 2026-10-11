import { Suspense } from "react";
import { Tonight } from "@/components/tonight";
import { Rail } from "@/components/poster";
import { getAiringThisWeek, getRails } from "@/lib/tvmaze";

async function AiringThisWeek() {
  const shows = await getAiringThisWeek();
  return <Rail title="New episodes this week" shows={shows} size="lg" />;
}

async function BrowseRails() {
  const rails = await getRails();
  return (
    <>
      {rails.map((r) => (
        <Rail key={r.title} title={r.title} shows={r.shows} />
      ))}
    </>
  );
}

function RailSkeleton() {
  return (
    <div className="mt-12 px-5 sm:px-8" aria-hidden>
      <div className="h-6 w-56 rounded bg-panel" />
      <div className="mt-4 flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[2/3] w-40 shrink-0 animate-pulse rounded-lg bg-panel" />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Tonight />
      <Suspense fallback={<RailSkeleton />}>
        <AiringThisWeek />
      </Suspense>
      <Suspense fallback={<RailSkeleton />}>
        <BrowseRails />
      </Suspense>
    </>
  );
}
