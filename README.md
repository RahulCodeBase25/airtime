# Airtime

**See what's on TV tonight, browse 70,000+ shows, and keep a watchlist with next-episode countdowns.**

Live: https://airtime-six.vercel.app

Airtime started as a Netflix-style clone I built while learning HTML and CSS. This version is a real app on real data: every show, episode and schedule comes live from the [TVmaze API](https://www.tvmaze.com/api).

## Features

- **Tonight timeline.** Everything airing on US TV today on one scrolling grid, one row per channel. A red line marks the current time and moves every 30 seconds, shows on air now get a progress bar, and you can switch between "around now" and prime time.
- **Show pages.** Backdrop art, rating, genres, a countdown to the next episode in your own time zone, every season and episode in tabs, and the cast.
- **⌘K search.** Press `⌘K`, `Ctrl+K` or `/` anywhere. Results are debounced, the best match is pre-selected, and Enter opens it.
- **Watchlist.** Save shows. The list is sorted by which show has the next new episode, with live countdowns. It's stored in your browser, so no account is needed.
- **Browse rails.** "New episodes this week" plus genre rails ranked by rating and popularity.

## Tech

| | |
|---|---|
| Framework | **Next.js 16** (App Router, React Server Components, Cache Components with `"use cache"`, Partial Prerendering) |
| Language | **TypeScript** |
| UI | **shadcn/ui** (Base UI primitives), **Tailwind CSS 4**, lucide icons, `cmdk` command palette |
| State | **Zustand** with `persist` (watchlist in localStorage, falls back to memory in private mode) |
| Data | TVmaze REST API, cached on the server |
| Hosting | Vercel |

## How it works (the interesting parts)

**Server-side caching with Cache Components.** All TVmaze calls live in `src/lib/tvmaze.ts`. Each function starts with `"use cache"` and a `cacheLife("hours")` or `cacheLife("days")`, so Next.js keeps the result and most page views never call TVmaze. That matters because TVmaze allows about 20 requests per 10 seconds.

**Partial Prerendering.** The home page is a static shell (heading, layout, skeletons) sent instantly. The rails stream in inside `<Suspense>`. Show pages for the 20 most popular shows are prerendered at build time with `generateStaticParams`. Any other show renders on first visit and is then cached.

**Where data is fetched.**
- Server Components fetch show pages and rails, so no API keys or extra requests reach the browser.
- The timeline is a Client Component because it needs the user's own clock and time zone. It calls `/api/schedule`, a Route Handler that trims TVmaze's response to the fields the grid needs.

**The timeline maths.** Each episode has an `airstamp` (UTC) and a runtime. Its block is placed at `(start - windowStart) × 4.2 px per minute` and sized by its runtime. Channels are ranked by the popularity of what they're showing, and the top 12 get a row. Show names use `position: sticky`, so the title stays readable while you scroll sideways through a long programme.

**No hydration surprises.** Next.js 16 refuses to read `Date.now()` during prerendering. So the clock, countdowns and localStorage are all read in `useEffect`, after the page reaches the browser.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build, shows which routes are static vs streamed
```

No API keys are needed.

## Project layout

```
src/
  app/
    page.tsx               home: timeline + rails
    show/[id]/page.tsx     show page (prerendered for popular shows)
    search/page.tsx        full search results
    watchlist/page.tsx
    api/schedule|search|upcoming/route.ts
  components/
    tonight.tsx            the live schedule grid
    search-palette.tsx     ⌘K search
    seasons.tsx            season tabs + episode list
    ui/                    shadcn/ui components
  lib/tvmaze.ts            typed, cached TVmaze client
  store/watchlist.ts       Zustand store
```

Data: [TVmaze](https://www.tvmaze.com) (CC BY-SA 4.0). Airtime is a portfolio project and isn't affiliated with any network.

## License

MIT © Rahul Singh
