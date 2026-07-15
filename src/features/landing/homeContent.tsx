"use client";

import { useState } from "react";

import {
  useMostVisitedContents,
  usePopularContents,
  useRecommendedContents,
} from "@/api/contents";
import { DramaPosterCarousel } from "@/components/dramaPosterCarousel";
import { Famous } from "@/components/famous";
import { Filter, type FilterValue } from "@/components/filter";
import { useI18n } from "@/i18n/provider";

export function HomeContent() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<FilterValue>("DRAMA");
  const contentType = filter;
  const typeLabel = { DRAMA: t("filter.drama"), MOVIE: t("filter.movie"), ANIMATION: t("filter.animation") }[filter];
  const popular = usePopularContents({ contentType, limit: 10 });
  const recommended = useRecommendedContents({ contentType, limit: 8 });
  const mostVisited = useMostVisitedContents({ contentType, limit: 8 });

  return (
    <>
      <div className="mt-5">
        <Filter value={filter} onChange={setFilter} />
      </div>
      <div className="mt-7">
        <Famous
          title={typeLabel}
          contents={popular.data}
          isLoading={popular.isPending}
          isError={popular.isError}
        />
      </div>
      <div className="mt-7 flex flex-col gap-7 pb-8">
        <DramaPosterCarousel
          id="recommended-dramas"
          title={t("home.recommended", { type: typeLabel })}
          contents={recommended.data?.content}
          isLoading={recommended.isPending}
          isError={recommended.isError}
        />
        <DramaPosterCarousel
          id="popular-scene-dramas"
          title={t("home.mostVisited", { type: typeLabel })}
          contents={mostVisited.data?.content}
          isLoading={mostVisited.isPending}
          isError={mostVisited.isError}
        />
      </div>
    </>
  );
}
