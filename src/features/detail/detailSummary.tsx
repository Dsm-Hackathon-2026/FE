import Image from "next/image";

import type { WorkDetail } from "@/features/detail/detail";
import { WorkDescription } from "@/features/detail/detailDescription";

type WorkSummaryProps = Pick<
  WorkDetail,
  "title" | "description" | "posterSrc" | "metadata"
>;

export function WorkSummary({
  title,
  description,
  posterSrc,
  metadata,
}: WorkSummaryProps) {
  return (
    <section className="mt-14 flex flex-col items-center" aria-labelledby="work-title">
      <div className="relative h-[178px] w-[136px] overflow-hidden rounded-[3px] sm:h-[209px] sm:w-40">
        <Image
          src={posterSrc}
          alt={`${title} 포스터`}
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

      <ul aria-label="작품 정보" className="mt-3 flex flex-wrap justify-center gap-1.5">
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
