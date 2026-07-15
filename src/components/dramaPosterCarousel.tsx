import Image from "next/image";
import Link from "next/link";

import type { ContentCardResponse } from "@/api/contents/type";

type DramaPosterCarouselProps = {
  id: string;
  title: string;
  contents?: readonly ContentCardResponse[];
  isLoading?: boolean;
  isError?: boolean;
};

export function DramaPosterCarousel({
  id,
  title,
  contents = [],
  isLoading = false,
  isError = false,
}: DramaPosterCarouselProps) {
  return (
    <section aria-labelledby={`${id}-title`}>
      <h2
        id={`${id}-title`}
        className="font-sans text-xl leading-7 font-bold tracking-[-0.025em] text-white"
      >
        {title}
      </h2>

      {isLoading ? (
        <p role="status" className="mt-5 text-sm text-[#aeaeae]">불러오는 중...</p>
      ) : isError ? (
        <p role="alert" className="mt-5 text-sm text-[#aeaeae]">목록을 불러오지 못했습니다.</p>
      ) : contents.length === 0 ? (
        <p role="status" className="mt-5 text-sm text-[#aeaeae]">표시할 작품이 없습니다.</p>
      ) : (
        <ol
          data-testid={`${id}-list`}
          aria-label={`${title} 목록`}
          tabIndex={0}
          className="mt-5 -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth scroll-px-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {contents.map((content, index) => (
            <li key={content.contentId} className="h-[130px] w-[98px] shrink-0 snap-start">
              <Link
                href={`/detail/${content.contentId}`}
                aria-label={`${content.title} 상세 보기`}
                className="block rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
              <Image
                src={content.thumbnailUrl}
                alt={`${title} ${index + 1}번째 ${content.title} 포스터`}
                width={98}
                height={130}
                className="h-[130px] w-[98px] object-cover"
              />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
