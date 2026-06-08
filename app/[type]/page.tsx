import { redirect } from "next/navigation";
import HubInteractive from "./HubInteractive";

interface PageProps {
  params: { type: string };
}

export default function HubPage({ params }: PageProps) {
  const { type } = params;

  if (type !== "movie" && type !== "tv") {
    redirect("/");
  }

  const label = type === "movie" ? "Movies" : "TV Shows";
  const icon = type === "movie" ? "🎥" : "📺";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">
        {icon} {label}
      </h1>
      {/* HubInteractive always fetches fresh data from Supabase on mount */}
      <HubInteractive type={type as "movie" | "tv"} />
    </div>
  );
}
