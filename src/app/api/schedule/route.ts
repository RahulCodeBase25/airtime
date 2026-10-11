import { NextResponse, type NextRequest } from "next/server";
import { getSchedule, channelOf, type ScheduleItem } from "@/lib/tvmaze";

// Today's US TV + streaming schedule, trimmed to what the timeline needs
const slim = (e: ScheduleItem) => ({
  id: e.id,
  airstamp: e.airstamp,
  runtime: e.runtime ?? e.show.averageRuntime ?? 30,
  season: e.season,
  number: e.number,
  name: e.name,
  show: { id: e.show.id, name: e.show.name, channel: channelOf(e.show), weight: e.show.weight, image: e.show.image?.medium ?? null },
});

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ message: "date must be YYYY-MM-DD" }, { status: 400 });
  try {
    const { tv, web } = await getSchedule(date);
    return NextResponse.json(
      { tv: tv.filter((e) => e.airstamp).map(slim), web: web.map(slim) },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } }
    );
  } catch {
    return NextResponse.json({ message: "Schedule is unavailable right now" }, { status: 502 });
  }
}
