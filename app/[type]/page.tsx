import { redirect } from "next/navigation";
import { getRankings } from "@/db";
import HubInteractive from "./HubInteractive";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { type: string };
}

export default async function HubPage({ params }: PageProps) {
  const { type } = params;

  if (type !== "movie" && type !== "tv") {
    redirect("/");
  }

  const initialItems = await getRankings(type);
  const label = type === "movie" ? "Movies" : "TV Shows";
  const icon = type === "movie" ? "🎥" : "📺";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">
        {icon} {label}
      </h1>
      <HubInteractive type={type as "movie" | "tv"} initialItems={initialItems} />
    </div>
  );
}
