"use client";

import Image from "next/image";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/languageSwitcher";
import { useI18n } from "@/i18n/provider";

export function Header() {
  const { t } = useI18n();
  return (
    <header className="flex items-center justify-between">
      <h1 aria-label={t("header.brand")}>
        <Image
          src="/header-logo.svg"
          alt=""
          width={93}
          height={32}
          data-testid="header-logo"
          priority
        />
      </h1>

      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <Link
          href="/search"
          aria-label={t("header.search")}
          className="-mr-2.5 flex size-11 items-center justify-center"
        >
          <Image src="/search-icon.svg" alt="" width={24} height={24} data-testid="search-icon" />
        </Link>
      </div>
    </header>
  );
}
