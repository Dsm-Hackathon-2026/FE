"use client";

const FILTERS = ["드라마", "영화", "애니메이션"] as const;

export type FilterValue = (typeof FILTERS)[number];

type FilterProps = {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
};

export function Filter({ value, onChange }: FilterProps) {

  return (
    <div role="group" aria-label="작품 유형 필터" className="flex h-12 items-stretch gap-4">
      {FILTERS.map((filter) => {
        const isActive = value === filter;

        return (
          <button
            key={filter}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(filter)}
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
