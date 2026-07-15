"use client";

import { useState } from "react";

import { CloseIcon } from "@/components/close-icon";
import { useI18n } from "@/i18n/provider";

const DEFAULT_RECENT_SEARCHES = [
  { id: "naruto", label: "나루토" },
  { id: "crash-landing-on-you", label: "이 사랑 통역되나요?" },
] as const;

export function RecentSearches() {
  const { t } = useI18n();
  const [searches, setSearches] = useState<
    readonly { id: string; label: string }[]
  >(DEFAULT_RECENT_SEARCHES);

  const removeSearch = (searchId: string) => {
    setSearches((currentSearches) =>
      currentSearches.filter((search) => search.id !== searchId),
    );
  };

  if (searches.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recent-searches-title" data-testid="recent-searches">
      <h2 id="recent-searches-title" className="text-xl leading-7 font-bold">
        {t("search.recent")}
      </h2>

      <ul className="mt-6 flex flex-col gap-6">
        {searches.map((search) => (
          <li key={search.id} className="relative h-6">
            <span className="block text-base leading-6 font-normal">{search.label}</span>
            <button
              type="button"
              aria-label={t("search.removeRecent", { label: search.label })}
              className="absolute -top-2.5 right-0 flex size-11 items-center justify-end focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
              onClick={() => removeSearch(search.id)}
            >
              <CloseIcon />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
