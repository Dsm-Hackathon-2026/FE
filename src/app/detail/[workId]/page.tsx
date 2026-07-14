import { notFound } from "next/navigation";

import { GOBLIN_DETAIL } from "@/features/detail/detail";
import { WorkDetailHeader } from "@/features/detail/detailHeader";
import { WorkSummary } from "@/features/detail/detailSummary";
import { FilmingLocationList } from "@/features/locations/filmingLocationList";

type WorkDetailPageProps = {
  params: Promise<{ workId: string }>;
};

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { workId } = await params;

  if (workId !== GOBLIN_DETAIL.id) {
    notFound();
  }

  return (
    <main
      data-testid="work-detail-screen"
      className="min-h-dvh bg-[#050505] bg-[url('/detail-screen-glow.svg')] bg-[length:100%_612px] bg-top bg-no-repeat text-white"
    >
      <div className="mx-auto w-full max-w-lg px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
        <WorkDetailHeader />
        <WorkSummary
          title={GOBLIN_DETAIL.title}
          description={GOBLIN_DETAIL.description}
          posterSrc={GOBLIN_DETAIL.posterSrc}
          metadata={GOBLIN_DETAIL.metadata}
        />
        <FilmingLocationList
          workTitle={GOBLIN_DETAIL.title}
          locations={GOBLIN_DETAIL.filmingLocations}
        />
      </div>
    </main>
  );
}
