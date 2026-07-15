"use client";

import type { ContentType } from "@/api/contents/type";
import { useI18n } from "@/i18n/provider";

const FILTERS: readonly ContentType[] = ["DRAMA", "MOVIE", "ANIMATION"];
export type FilterValue = ContentType;

type FilterProps = {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
};

export function Filter({ value, onChange }: FilterProps) {
  const { t } = useI18n();
  const labels: Record<ContentType, string> = {
    DRAMA: t("filter.drama"), MOVIE: t("filter.movie"), ANIMATION: t("filter.animation"),
  };

  return (
    <div role="group" aria-label={t("filter.label")} className="flex h-12 items-stretch gap-4">
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
            <span data-filter-label>{labels[filter]}</span>
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
