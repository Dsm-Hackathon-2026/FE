"use client";

import Image from "next/image";
import { type AnimationEvent, useState } from "react";

export function LandingIntro() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.animationName === "landing-slide-out") {
      setIsVisible(false);
    }
  };

  return (
    <div
      role="status"
      aria-label="성덕순례 시작 화면"
      data-testid="landing-intro"
      className="fixed inset-0 z-50 animate-landing-slide-out overflow-hidden bg-black px-6 will-change-transform motion-reduce:animate-landing-slide-out-reduced"
      onAnimationEnd={handleAnimationEnd}
    >
      <Image
        src="/landing-icon.svg"
        alt="성덕순례"
        width={200}
        height={200}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        priority
      />

      <section
        aria-label="성덕순례 소개"
        className="absolute bottom-[max(3rem,env(safe-area-inset-bottom))] left-1/2 flex w-[268px] -translate-x-1/2 flex-col items-center gap-3"
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
      </section>
    </div>
  );
}
