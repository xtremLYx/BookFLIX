import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClubDetail from "./ClubDetail";

export default async function ClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
          <span className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">
            Loading Club...
          </span>
        </div>
      }
    >
      <ClubDetail clubId={id} />
    </Suspense>
  );
}
