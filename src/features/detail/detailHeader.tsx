"use client";

import Image from "next/image";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/languageSwitcher";
import { useI18n } from "@/i18n/provider";

export function WorkDetailHeader() {
  const { t } = useI18n();
  return (
    <header className="flex h-11 items-center justify-between">
      <Link
        href="/"
        aria-label={t("common.backHome")}
        className="-ml-2.5 flex size-11 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Image src="/back-icon.svg" alt="" width={24} height={24} priority />
      </Link>
      <LanguageSwitcher />
    </header>
  );
}
