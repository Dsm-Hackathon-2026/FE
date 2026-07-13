import { LandingIntro } from "@/features/landing/landing-intro";

export default function Home() {
  return (
    <>
      <main
        data-testid="home-screen"
        className="min-h-dvh bg-[#101010] px-6 pt-[max(2rem,env(safe-area-inset-top))] text-white"
      >
        <h1 className="text-lg font-semibold tracking-[-0.02em]">성덕순례</h1>

        <section className="pt-[18vh]">
          <p className="text-sm font-medium text-[#8c8c8c]">작품 속 장소를 여행하다</p>
          <h2 className="mt-3 text-[2rem] leading-[1.25] font-semibold tracking-[-0.035em]">
            어떤 작품 속으로
            <br />
            떠나볼까요?
          </h2>
        </section>
      </main>

      <LandingIntro />
    </>
  );
}
