"use client";

import Image from "next/image";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/languageSwitcher";
import { useI18n } from "@/i18n/provider";

type SearchHeaderProps = {
  backHref?: string;
};

export function SearchHeader({ backHref = "/" }: SearchHeaderProps) {
  const { t } = useI18n();
  return (
    <header className="flex items-center justify-between">
      <Link
        href={backHref}
        aria-label={t("common.back")}
        className="-ml-2.5 flex size-11 items-center justify-center"
      >
        <Image
          src="/back-icon.svg"
          alt=""
          width={24}
          height={24}
          data-testid="back-icon"
        />
      </Link>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <Link href="/" aria-label={t("common.home")}>
          <Image src="/header-logo.svg" alt="" width={93} height={32} data-testid="search-header-logo" priority />
        </Link>
      </div>
    </header>
  );
}
