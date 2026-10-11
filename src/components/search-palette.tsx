"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Hit = { id: number; name: string; image: string | null; year: string | null; channel: string };

// ⌘K / Ctrl+K search over every show on TVmaze, with debounced requests
export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const latest = useRef("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = q.trim();
    latest.current = term;
    if (term.length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const data: Hit[] = await res.json();
        if (latest.current === term) {
          setHits(data);
          // keep the best match highlighted so Enter opens it
          setSelected(data[0] ? String(data[0].id) : "all-results");
        }
      } finally {
        if (latest.current === term) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = (path: string) => {
    setOpen(false);
    setQ("");
    router.push(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-full bg-panel px-3 text-sm text-muted-foreground ring-1 ring-border transition hover:text-foreground sm:w-64"
        aria-label="Search shows"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search shows</span>
        <kbd className="ml-auto hidden rounded bg-night px-1.5 py-0.5 text-[11px] sm:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search shows" description="Type a show name">
        {/* Results come from the server already ranked, so turn off cmdk's own filter */}
        <Command shouldFilter={false} value={selected} onValueChange={setSelected}>
        <CommandInputWrap value={q} onChange={setQ} />
        <CommandList className="max-h-[60vh]">
          {q.trim().length >= 2 && !loading && <CommandEmpty>No shows match “{q.trim()}”.</CommandEmpty>}
          {q.trim().length < 2 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Type at least two letters.</p>}
          {hits.length > 0 && (
            <CommandGroup heading="Shows">
              {hits.map((h) => (
                <CommandItem key={h.id} value={`${h.id}`} onSelect={() => go(`/show/${h.id}`)} className="gap-3">
                  {h.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.image} alt="" className="h-12 w-8 shrink-0 rounded object-cover" />
                  ) : (
                    <span className="h-12 w-8 shrink-0 rounded bg-panel-2" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{h.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[h.year, h.channel].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {q.trim().length >= 2 && (
            <CommandGroup heading="More">
              <CommandItem value="all-results" onSelect={() => go(`/search?q=${encodeURIComponent(q.trim())}`)}>
                See all results for “{q.trim()}”
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

function CommandInputWrap({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <CommandInput placeholder="Search 70,000+ shows…" value={value} onValueChange={onChange} />;
}
