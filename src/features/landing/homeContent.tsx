"use client";

import { useState } from "react";

import {
  useMostVisitedContents,
  usePopularContents,
  useRecommendedContents,
} from "@/api/contents";
import type { ContentType } from "@/api/contents/type";
import { DramaPosterCarousel } from "@/components/dramaPosterCarousel";
import { Famous } from "@/components/famous";
import { Filter, type FilterValue } from "@/components/filter";

const CONTENT_TYPE_BY_FILTER: Record<FilterValue, ContentType> = {
  드라마: "DRAMA",
  영화: "MOVIE",
  애니메이션: "ANIMATION",
};

export function HomeContent() {
  const [filter, setFilter] = useState<FilterValue>("드라마");
  const contentType = CONTENT_TYPE_BY_FILTER[filter];
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
          title={filter}
          contents={popular.data}
          isLoading={popular.isPending}
          isError={popular.isError}
        />
      </div>
      <div className="mt-7 flex flex-col gap-7 pb-8">
        <DramaPosterCarousel
          id="recommended-dramas"
          title={`추천 ${filter}`}
          contents={recommended.data?.content}
          isLoading={recommended.isPending}
          isError={recommended.isError}
        />
        <DramaPosterCarousel
          id="popular-scene-dramas"
          title={`지금 가장 많이 가는 명장면 ${filter}`}
          contents={mostVisited.data?.content}
          isLoading={mostVisited.isPending}
          isError={mostVisited.isError}
        />
      </div>
    </>
  );
}
