import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediaRanker",
  description: "Rank your movies and TV shows with pairwise comparisons",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#0f0f14]`}>
        {/* Nav */}
        <nav className="sticky top-0 z-40 bg-[#0f0f14] border-b border-gray-800 px-4 py-3 flex items-center gap-6">
          <Link
            href="/"
            className="text-white font-bold text-lg tracking-tight hover:text-indigo-400 transition-colors"
          >
            🎬 MediaRanker
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/movie"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Movies
            </Link>
            <Link
              href="/tv"
              className="text-gray-400 hover:text-white transition-colors"
            >
              TV Shows
            </Link>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
