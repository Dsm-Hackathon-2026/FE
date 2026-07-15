"use client";

import { useContentDetail } from "@/api/contents";
import { useSpots } from "@/api/spots";
import { WorkDetailHeader } from "@/features/detail/detailHeader";
import { WorkSummary } from "@/features/detail/detailSummary";
import { FilmingLocationList } from "@/features/locations/filmingLocationList";

const CONTENT_TYPE_LABEL = {
  DRAMA: "드라마",
  MOVIE: "영화",
  ANIMATION: "애니메이션",
} as const;

export function WorkDetailScreen({
  appKey,
  contentId,
}: {
  appKey?: string;
  contentId: number;
}) {
  const detail = useContentDetail(contentId);
  const spots = useSpots(contentId);

  if (detail.isPending || spots.isPending) {
    return <DetailState role="status">작품 정보를 불러오는 중...</DetailState>;
  }

  if (detail.isError || spots.isError) {
    return <DetailState role="alert">작품 정보를 불러오지 못했습니다.</DetailState>;
  }

  return (
    <main
      data-testid="work-detail-screen"
      className="min-h-dvh bg-[#050505] bg-[url('/detail-screen-glow.svg')] bg-[length:100%_612px] bg-top bg-no-repeat text-white"
    >
      <div className="mx-auto w-full max-w-lg px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
        <WorkDetailHeader />
        <WorkSummary
          title={detail.data.title}
          description={detail.data.description}
          posterSrc={detail.data.thumbnailUrl}
          metadata={[
            String(detail.data.releaseYear),
            CONTENT_TYPE_LABEL[detail.data.contentType],
            detail.data.country,
          ]}
        />
        <FilmingLocationList
          appKey={appKey}
          workId={String(contentId)}
          workTitle={detail.data.title}
          locations={spots.data.content.map((spot) => ({
            id: String(spot.spotId),
            name: spot.name,
            address: spot.address,
            imageSrc: spot.imageUrl,
            imageAlt: `${spot.name} 전경`,
            latitude: spot.latitude,
            longitude: spot.longitude,
          }))}
        />
      </div>
    </main>
  );
}

function DetailState({ children, role }: { children: string; role: "status" | "alert" }) {
  return (
    <main className="flex min-h-dvh flex-col bg-[#050505] px-5 pt-[max(1rem,env(safe-area-inset-top))] text-white">
      <WorkDetailHeader />
      <p role={role} className="m-auto text-sm text-[#aeaeae]">{children}</p>
    </main>
  );
}
