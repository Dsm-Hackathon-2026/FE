import Image from "next/image";

const POSTERS = [
  {
    title: "도깨비",
    imageSrc: "/famous-drama-1.png",
    posterWidth: 126,
  },
  {
    title: "사랑의 불시착",
    imageSrc: "/famous-drama-2.png",
    posterWidth: 105,
  },
] as const;

const RANK_WIDTHS = [32, 41, 43, 45, 42.5, 43.5, 39, 44, 43.5, 73] as const;

const FAMOUS_DRAMAS = Array.from({ length: 10 }, (_, index) => {
  const rank = index + 1;
  const poster = POSTERS[index % POSTERS.length];

  return {
    ...poster,
    rank,
    rankWidth: RANK_WIDTHS[index],
  };
});

export function Famous() {
  return (
    <section aria-labelledby="famous-title">
      <h2
        id="famous-title"
        className="font-sans text-xl leading-7 font-semibold tracking-[-0.025em] text-white"
      >
        명장면이 있는 인기 드라마
      </h2>

      <ol
        data-testid="famous-list"
        aria-label="인기 드라마 순위"
        tabIndex={0}
        className="mt-5 -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FAMOUS_DRAMAS.map((drama) => (
          <li key={drama.rank} className="flex h-[168px] shrink-0 snap-start items-end gap-5">
            <div className="relative h-[86px] shrink-0" style={{ width: drama.rankWidth }}>
              <span
                aria-hidden="true"
                data-testid={`famous-rank-${drama.rank}`}
                className="absolute bottom-0 left-0 z-10 font-sans text-[120px] leading-[0.72] font-black italic tracking-[-0.08em] text-white [transform-origin:left_bottom] [transform:scaleX(0.55)_skewX(-6deg)]"
              >
                {drama.rank}
              </span>
            </div>

            <div
              data-testid={`famous-poster-${drama.rank}`}
              className="relative h-[168px] shrink-0 overflow-hidden"
              style={{ width: drama.posterWidth }}
            >
              <Image
                src={drama.imageSrc}
                alt={`${drama.rank}위 ${drama.title} 포스터`}
                fill
                sizes={`${drama.posterWidth}px`}
                className="object-cover"
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
