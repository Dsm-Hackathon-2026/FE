import { DramaPosterCarousel } from "@/components/drama-poster-carousel";
import { Filter } from "@/components/filter";
import { Famous } from "@/components/famous";
import { Header } from "@/components/header";
import { LandingIntro } from "@/features/landing/landing-intro";

export default function Home() {
  return (
    <>
      <main
        data-testid="home-screen"
        className="min-h-dvh bg-[#101010] px-6 pt-[max(2rem,env(safe-area-inset-top))] text-white"
      >
        <Header />
        <div className="mt-5">
          <Filter />
        </div>
        <div className="mt-7">
          <Famous />
        </div>
        <div className="mt-7 flex flex-col gap-7 pb-8">
          <DramaPosterCarousel id="recommended-dramas" title="추천 드라마" />
          <DramaPosterCarousel
            id="popular-scene-dramas"
            title="지금 가장 많이 가는 명장면 드라마"
          />
        </div>
      </main>

      <LandingIntro />
    </>
  );
}
