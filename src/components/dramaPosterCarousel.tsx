"use client";

import Image from "next/image";
import Link from "next/link";

import type { ContentCardResponse } from "@/api/contents/type";
import { useI18n } from "@/i18n/provider";

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
  const { t } = useI18n();
  return (
    <section aria-labelledby={`${id}-title`}>
      <h2
        id={`${id}-title`}
        className="font-sans text-xl leading-7 font-bold tracking-[-0.025em] text-white"
      >
        {title}
      </h2>

      {isLoading ? (
        <p role="status" className="mt-5 text-sm text-[#aeaeae]">{t("common.loading")}</p>
      ) : isError ? (
        <p role="alert" className="mt-5 text-sm text-[#aeaeae]">{t("common.listError")}</p>
      ) : contents.length === 0 ? (
        <p role="status" className="mt-5 text-sm text-[#aeaeae]">{t("common.emptyWorks")}</p>
      ) : (
        <ol
          data-testid={`${id}-list`}
          aria-label={t("common.list", { title })}
          tabIndex={0}
          className="mt-5 -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth scroll-px-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {contents.map((content, index) => (
            <li key={content.contentId} className="h-[130px] w-[98px] shrink-0 snap-start">
              <Link
                href={`/detail/${content.contentId}`}
                aria-label={t("common.workDetail", { title: content.title })}
                className="block rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
              <Image
                src={content.thumbnailUrl}
                alt={t("home.carouselPoster", { section: title, index: index + 1, title: content.title })}
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
