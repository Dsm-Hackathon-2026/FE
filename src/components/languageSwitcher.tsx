"use client";

import { useI18n, type Locale } from "@/i18n/provider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div role="group" aria-label={t("language.label")} className="flex rounded-full border border-white/25 bg-black/35 p-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
      {(["ko", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={locale === option}
          onClick={() => setLocale(option as Locale)}
          className={`min-h-8 rounded-full px-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${locale === option ? "bg-white text-black" : "text-white/75"}`}
        >
          {option === "ko" ? t("language.ko") : t("language.en")}
        </button>
      ))}
    </div>
  );
}
