"use client";

import Image from "next/image";

import { WorkDescription } from "@/features/detail/detailDescription";
import { useI18n } from "@/i18n/provider";

type WorkSummaryProps = {
  title: string;
  description: string;
  posterSrc: string;
  metadata: readonly string[];
};

export function WorkSummary({
  title,
  description,
  posterSrc,
  metadata,
}: WorkSummaryProps) {
  const { t } = useI18n();
  return (
    <section className="mt-14 flex flex-col items-center" aria-labelledby="work-title">
      <div className="relative h-[178px] w-[136px] overflow-hidden rounded-[3px] sm:h-[209px] sm:w-40">
        <Image
          src={posterSrc}
          alt={t("common.poster", { title })}
          fill
          sizes="(min-width: 640px) 160px, 136px"
          className="object-cover"
          priority
        />
      </div>

      <h1
        id="work-title"
        className="mt-3 text-xl leading-7 font-medium tracking-[-0.025em] text-white"
      >
        {title}
      </h1>

      <ul aria-label={t("detail.metadata")} className="mt-3 flex flex-wrap justify-center gap-1.5">
        {metadata.map((item) => (
          <li
            key={item}
            className="flex h-6 min-w-[55px] items-center justify-center rounded-[5px] border border-[#858585] px-2.5 text-sm leading-none font-normal text-[#adadad]"
          >
            {item}
          </li>
        ))}
      </ul>

      <WorkDescription description={description} />
    </section>
  );
}
