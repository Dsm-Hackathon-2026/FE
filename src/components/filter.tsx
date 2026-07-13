"use client";

import { useState } from "react";

const FILTERS = ["드라마", "영화", "애니메이션"] as const;

type FilterValue = (typeof FILTERS)[number];

export function Filter() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("드라마");

  return (
    <div role="group" aria-label="작품 유형 필터" className="flex h-12 items-stretch gap-4">
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter;

        return (
          <button
            key={filter}
            type="button"
            aria-pressed={isActive}
            onClick={() => setActiveFilter(filter)}
            className={`flex min-w-[72px] flex-col items-center justify-end gap-[7px] px-1 font-sans text-base leading-4 tracking-[-0.02em] transition-colors ${
              isActive ? "font-semibold text-white" : "font-normal text-[#aeaeae]"
            }`}
          >
            <span data-filter-label>{filter}</span>
            <span
              data-testid={isActive ? "filter-indicator" : undefined}
              aria-hidden="true"
              className={`h-0.5 w-[72px] ${isActive ? "bg-white" : "bg-transparent"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
