import { NextResponse, type NextRequest } from "next/server";
import { getShow } from "@/lib/tvmaze";

// Next episode for each show on a watchlist: /api/upcoming?ids=1,2,3
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 20);
  const shows = await Promise.all(ids.map((id) => getShow(id).catch(() => null)));
  return NextResponse.json(
    shows.filter(Boolean).map((s) => ({
      id: s!.id,
      status: s!.status,
      next: s!._embedded.nextepisode
        ? { airstamp: s!._embedded.nextepisode.airstamp, season: s!._embedded.nextepisode.season, number: s!._embedded.nextepisode.number, name: s!._embedded.nextepisode.name }
        : null,
    }))
  );
}
