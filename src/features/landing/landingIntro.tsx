"use client";

import Image from "next/image";
import { type AnimationEvent, useState } from "react";
import { useI18n } from "@/i18n/provider";

export function LandingIntro() {
  const { t } = useI18n();
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
      aria-label={t("landing.start")}
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
            alt={t("header.brand")}
            width={200}
            height={200}
            priority
          />
        </div>
      </div>

      <section
        aria-label={t("landing.intro")}
        className="absolute bottom-[max(3rem,env(safe-area-inset-bottom))] left-1/2 w-[268px] -translate-x-1/2"
      >
        <div
          data-testid="landing-feature"
          className="flex animate-landing-feature-in flex-col items-center gap-3 will-change-[opacity,transform] motion-reduce:animate-none"
        >
          <p className="text-center text-xl leading-[1.4] font-light tracking-[-0.02em] text-white">
            {t("landing.tagline").split("\n").map((line, index) => <span key={line}>{index > 0 ? <br /> : null}{line}</span>)}
          </p>

          <div className="relative h-[84px] w-[268px] overflow-hidden rounded-[10px]">
            <Image
              src="/monthly-destination.png"
              alt={t("landing.destinationAlt")}
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
