import { NextResponse, type NextRequest } from "next/server";
import { searchShows, channelOf } from "@/lib/tvmaze";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json([]);
  try {
    const shows = await searchShows(q.toLowerCase());
    return NextResponse.json(
      shows.slice(0, 8).map((s) => ({
        id: s.id,
        name: s.name,
        image: s.image?.medium ?? null,
        year: s.premiered?.slice(0, 4) ?? null,
        channel: channelOf(s),
      })),
      { headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
