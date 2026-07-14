"use client";

import Image from "next/image";
import { type AnimationEvent, useState } from "react";

export function LandingIntro() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target && event.animationName === "landing-intro-exit") {
      setIsVisible(false);
    }
  };

  return (
    <div
      role="status"
      aria-label="성덕순례 시작 화면"
      data-testid="landing-intro"
      className="fixed inset-0 z-50 animate-landing-intro-exit overflow-hidden bg-black px-6 will-change-[opacity,transform] motion-reduce:hidden"
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        data-testid="landing-brand-frame"
        className="absolute left-1/2 top-1/2 size-[200px] -translate-x-1/2 -translate-y-1/2"
      >
        <div
          data-testid="landing-brand"
          className="animate-landing-brand-in will-change-[opacity,transform] motion-reduce:animate-none"
        >
          <Image
            src="/landing-icon.svg"
            alt="성덕순례"
            width={200}
            height={200}
            priority
          />
        </div>
      </div>

      <section
        aria-label="성덕순례 소개"
        className="absolute bottom-[max(3rem,env(safe-area-inset-bottom))] left-1/2 w-[268px] -translate-x-1/2"
      >
        <div
          data-testid="landing-feature"
          className="flex animate-landing-feature-in flex-col items-center gap-3 will-change-[opacity,transform] motion-reduce:animate-none"
        >
          <p className="text-center text-xl leading-[1.4] font-light tracking-[-0.02em] text-white">
            나의 최애 드라마를
            <br />
            직접 만나는 순간.
          </p>

          <div className="relative h-[84px] w-[268px] overflow-hidden rounded-[10px]">
            <Image
              src="/monthly-destination.png"
              alt="이달의 여행지, 강릉 연진 해변"
              fill
              sizes="268px"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
