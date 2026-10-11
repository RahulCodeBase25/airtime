import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-5 text-center">
      <div>
        <p className="font-display text-7xl font-extrabold text-on-air">Off air</p>
        <p className="mt-4 text-muted-foreground">There's no show or page at this address.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-night">
          See what's on tonight
        </Link>
      </div>
    </div>
  );
}
