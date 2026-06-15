import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SearchContent from "./SearchContent";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
          <span className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">
            Searching Book Database...
          </span>
        </div>
      }
    >
      <SearchContent key={query} initialQuery={query} />
    </Suspense>
  );
}
