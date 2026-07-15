import Image from "next/image";
import Link from "next/link";

import type { ContentSummaryResponse } from "@/api/contents/type";

const RANK_WIDTHS = [32, 41, 43, 45, 42.5, 43.5, 39, 44, 43.5, 73] as const;

type FamousProps = {
  title: string;
  contents?: readonly ContentSummaryResponse[];
  isLoading?: boolean;
  isError?: boolean;
};

export function Famous({ title, contents = [], isLoading = false, isError = false }: FamousProps) {
  return (
    <section aria-labelledby="famous-title">
      <h2
        id="famous-title"
        className="font-sans text-xl leading-7 font-semibold tracking-[-0.025em] text-white"
      >
        명장면이 있는 인기 {title}
      </h2>

      {isLoading ? (
        <p role="status" className="mt-5 text-sm text-[#aeaeae]">불러오는 중...</p>
      ) : isError ? (
        <p role="alert" className="mt-5 text-sm text-[#aeaeae]">인기 작품을 불러오지 못했습니다.</p>
      ) : contents.length === 0 ? (
        <p role="status" className="mt-5 text-sm text-[#aeaeae]">표시할 작품이 없습니다.</p>
      ) : <ol
        data-testid="famous-list"
        aria-label="인기 드라마 순위"
        tabIndex={0}
        className="mt-5 -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {contents.map((content, index) => {
          const rank = index + 1;
          const posterWidth = index % 2 === 0 ? 126 : 105;
          return <li key={content.contentId} className="flex h-[168px] shrink-0 snap-start items-end gap-5">
            <div className="relative h-[86px] shrink-0" style={{ width: RANK_WIDTHS[index] ?? 44 }}>
              <span
                aria-hidden="true"
                data-testid={`famous-rank-${rank}`}
                className="absolute bottom-0 left-0 z-10 font-sans text-[120px] leading-[0.72] font-black italic tracking-[-0.08em] text-white [transform-origin:left_bottom] [transform:scaleX(0.55)_skewX(-6deg)]"
              >
                {rank}
              </span>
            </div>

            <Link
                href={`/detail/${content.contentId}`}
                aria-label={`${content.title} 상세 보기`}
                data-testid={`famous-poster-${rank}`}
                className="relative h-[168px] shrink-0 overflow-hidden rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ width: posterWidth }}
              >
                <Image
                  src={content.thumbnailUrl}
                  alt={`${rank}위 ${content.title} 포스터`}
                  fill
                  sizes={`${posterWidth}px`}
                  className="object-cover"
                />
              </Link>
          </li>
        })}
      </ol>
      }
    </section>
  );
}
