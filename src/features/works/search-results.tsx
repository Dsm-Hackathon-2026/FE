import Image from "next/image";

const DUMMY_SEARCH_RESULTS = [
  { id: "result-1", title: "도깨비", imageSrc: "/famous-drama-1.png" },
  { id: "result-2", title: "이 사랑 통역되나요?", imageSrc: "/famous-drama-2.png" },
  { id: "result-3", title: "도깨비", imageSrc: "/famous-drama-1.png" },
  { id: "result-4", title: "이 사랑 통역되나요?", imageSrc: "/famous-drama-2.png" },
  { id: "result-5", title: "도깨비", imageSrc: "/famous-drama-1.png" },
  { id: "result-6", title: "이 사랑 통역되나요?", imageSrc: "/famous-drama-2.png" },
  { id: "result-7", title: "도깨비", imageSrc: "/famous-drama-1.png" },
  { id: "result-8", title: "이 사랑 통역되나요?", imageSrc: "/famous-drama-2.png" },
] as const;

type SearchResultsProps = {
  query: string;
};

export function SearchResults({ query }: SearchResultsProps) {
  const normalizedQuery = query.toLocaleLowerCase("ko");
  const matchingResults = DUMMY_SEARCH_RESULTS.filter((work) =>
    work.title.toLocaleLowerCase("ko").includes(normalizedQuery),
  );

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
            <li key={work.id} className="h-[141px] w-[107px] shrink-0 snap-start">
              <Image
                src={work.imageSrc}
                alt={`${query} 관련 작품 ${index + 1}번째 ${work.title} 포스터`}
                width={107}
                height={141}
                className="h-[141px] w-[107px] rounded-[3px] object-cover"
              />
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
