import type { Metadata, Viewport } from "next";
import { Geist, Bricolage_Grotesque } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "Airtime: what's on tonight", template: "%s · Airtime" },
  description: "See every show airing on US TV tonight, browse 70,000+ series, and keep a watchlist with next-episode countdowns. Built with Next.js 16 and the TVmaze API.",
};

export const viewport: Viewport = { themeColor: "#0f1b2d" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1400px] flex-1 pb-20">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-3 px-5 py-6 text-sm text-muted-foreground sm:px-8">
            <p>
              Show data from{" "}
              <a className="underline underline-offset-2 hover:text-foreground" href="https://www.tvmaze.com/api" target="_blank" rel="noreferrer">
                TVmaze
              </a>{" "}
              (CC BY-SA). Airtime is a portfolio project by{" "}
              <a className="underline underline-offset-2 hover:text-foreground" href="https://rahul-dev-portfolio.vercel.app" target="_blank" rel="noreferrer">
                Rahul Singh
              </a>
              .
            </p>
            <a className="hover:text-foreground" href="https://github.com/RahulCodeBase25/airtime" target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
