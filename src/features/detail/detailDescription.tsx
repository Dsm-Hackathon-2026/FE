"use client";

import { useState } from "react";

type WorkDescriptionProps = {
  description: string;
};

export function WorkDescription({ description }: WorkDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-7 w-full">
      <p
        id="work-description"
        data-testid="work-description"
        className={`text-[15px] leading-[1.55] font-normal tracking-[-0.015em] text-[#9b9b9b] ${
          isExpanded ? "" : "line-clamp-3"
        }`}
      >
        {description}
      </p>
      <button
        type="button"
        aria-controls="work-description"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((currentValue) => !currentValue)}
        className="mt-2 flex min-h-11 items-center text-[15px] leading-6 text-[#e5e5e5] underline decoration-[#e5e5e5] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {isExpanded ? "접기" : "더보기"}
      </button>
    </div>
  );
}
