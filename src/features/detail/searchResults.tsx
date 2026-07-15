import Image from "next/image";
import Link from "next/link";

import { useSearchContents } from "@/api/contents";

type SearchResultsProps = {
  query: string;
};

export function SearchResults({ query }: SearchResultsProps) {
  const search = useSearchContents({ keyword: query, size: 10 });

  if (search.isPending) {
    return <p role="status" className="text-sm text-[#aeaeae]">검색 중...</p>;
  }

  if (search.isError) {
    return <p role="alert" className="text-sm text-[#aeaeae]">검색 결과를 불러오지 못했습니다.</p>;
  }

  const matchingResults = search.data.content;

  return (
    <section id="search-results" aria-labelledby="search-results-title">
      <h2 id="search-results-title" className="text-xl leading-7 font-bold">
        검색어와 관련된 작품
      </h2>

      {matchingResults.length > 0 ? (
        <ul
          aria-label={`${query} 관련 작품 목록`}
          data-testid="search-results-list"
          tabIndex={0}
          className="mt-6 -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth scroll-px-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {matchingResults.map((work, index) => (
            <li key={work.contentId} className="h-[141px] w-[107px] shrink-0 snap-start">
              <Link href={`/detail/${work.contentId}`} aria-label={`${work.title} 상세 보기`}>
                <Image
                  src={work.thumbnailUrl}
                  alt={`${query} 관련 작품 ${index + 1}번째 ${work.title} 포스터`}
                  width={107}
                  height={141}
                  className="h-[141px] w-[107px] rounded-[3px] object-cover"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="empty-search-results"
          className="fixed inset-x-6 top-1/2 -translate-y-1/2 text-center text-base leading-6 font-light text-[#777777]"
        >
          해당하는 작품이 없습니다.
        </p>
      )}
    </section>
  );
}
