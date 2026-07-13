import Image from "next/image";

const DUMMY_POSTERS = [
  { title: "도깨비", imageSrc: "/famous-drama-1.png" },
  { title: "이 사랑 통역되나요?", imageSrc: "/famous-drama-2.png" },
  { title: "도깨비", imageSrc: "/famous-drama-1.png" },
  { title: "이 사랑 통역되나요?", imageSrc: "/famous-drama-2.png" },
  { title: "도깨비", imageSrc: "/famous-drama-1.png" },
  { title: "이 사랑 통역되나요?", imageSrc: "/famous-drama-2.png" },
  { title: "도깨비", imageSrc: "/famous-drama-1.png" },
  { title: "이 사랑 통역되나요?", imageSrc: "/famous-drama-2.png" },
] as const;

type DramaPosterCarouselProps = {
  id: string;
  title: string;
};

export function DramaPosterCarousel({ id, title }: DramaPosterCarouselProps) {
  return (
    <section aria-labelledby={`${id}-title`}>
      <h2
        id={`${id}-title`}
        className="font-sans text-xl leading-7 font-bold tracking-[-0.025em] text-white"
      >
        {title}
      </h2>

      <ol
        data-testid={`${id}-list`}
        aria-label={`${title} 목록`}
        tabIndex={0}
        className="mt-5 -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth scroll-px-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {DUMMY_POSTERS.map((poster, index) => (
          <li key={`${poster.title}-${index}`} className="h-[130px] w-[98px] shrink-0 snap-start">
            <Image
              src={poster.imageSrc}
              alt={`${title} ${index + 1}번째 ${poster.title} 포스터`}
              width={98}
              height={130}
              className="h-[130px] w-[98px] object-cover"
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
