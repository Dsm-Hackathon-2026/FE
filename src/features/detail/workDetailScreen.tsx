"use client";

import { useContentDetail } from "@/api/contents";
import { useSpots } from "@/api/spots";
import { WorkDetailHeader } from "@/features/detail/detailHeader";
import { WorkSummary } from "@/features/detail/detailSummary";
import { FilmingLocationList } from "@/features/locations/filmingLocationList";
import { buildRegionalCourses } from "@/features/locations/regional-course";
import { RegionalCourseList } from "@/features/locations/regionalCourseList";
import { useI18n } from "@/i18n/provider";

export function WorkDetailScreen({
  appKey,
  contentId,
}: {
  appKey?: string;
  contentId: number;
}) {
  const { t } = useI18n();
  const detail = useContentDetail(contentId);
  const spots = useSpots(contentId);

  if (detail.isPending || spots.isPending) {
    return <DetailState role="status">{t("detail.loading")}</DetailState>;
  }

  if (detail.isError || spots.isError) {
    return <DetailState role="alert">{t("detail.error")}</DetailState>;
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
            { DRAMA: t("filter.drama"), MOVIE: t("filter.movie"), ANIMATION: t("filter.animation") }[detail.data.contentType],
            detail.data.country,
          ]}
        />
        <RegionalCourseList
          appKey={appKey}
          courses={buildRegionalCourses(contentId, spots.data.content)}
          workId={String(contentId)}
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
            imageAlt: t("detail.imageAlt", { name: spot.name }),
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
