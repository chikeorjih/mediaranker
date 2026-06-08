import { redirect } from "next/navigation";
import Link from "next/link";
import CompareScreen from "@/components/CompareScreen";

interface PageProps {
  params: { type: string };
}

export default function ComparePage({ params }: PageProps) {
  const { type } = params;

  if (type !== "movie" && type !== "tv") {
    redirect("/");
  }

  const label = type === "movie" ? "Movies" : "TV Shows";

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href={`/${type}`}
          className="text-gray-500 hover:text-white text-sm transition-colors"
        >
          ← Back to {label}
        </Link>
      </div>

      <CompareScreen type={type as "movie" | "tv"} />
    </div>
  );
}
