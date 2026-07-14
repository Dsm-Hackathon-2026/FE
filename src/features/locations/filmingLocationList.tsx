import Image from "next/image";

import type { FilmingLocation } from "@/features/detail/detail";

type FilmingLocationListProps = {
  workTitle: string;
  locations: readonly FilmingLocation[];
};

export function FilmingLocationList({
  workTitle,
  locations,
}: FilmingLocationListProps) {
  return (
    <section className="mt-11" aria-labelledby="filming-locations-title">
      <h2
        id="filming-locations-title"
        className="text-[22px] leading-8 font-bold tracking-[-0.025em] text-white"
      >
        {workTitle}의 명장면 장소
      </h2>

      <ol className="mt-6 flex flex-col gap-8" data-testid="filming-location-list">
        {locations.map((location) => (
          <li key={location.id}>
            <article className="grid grid-cols-[124px_minmax(0,1fr)] items-center gap-3.5 sm:grid-cols-[144px_minmax(0,1fr)] sm:gap-5">
              <div className="relative h-[84px] overflow-hidden rounded-[3px]">
                <Image
                  src={location.imageSrc}
                  alt={location.imageAlt}
                  fill
                  sizes="(min-width: 640px) 144px, 124px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-lg leading-6 font-semibold tracking-[-0.02em] text-white">
                  {location.name}
                </h3>
                <address className="mt-1.5 truncate text-[13px] leading-5 font-normal not-italic text-[#a6a6a6]">
                  {location.address}
                </address>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
