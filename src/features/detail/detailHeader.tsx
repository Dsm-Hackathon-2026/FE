import Image from "next/image";
import Link from "next/link";

export function WorkDetailHeader() {
  return (
    <header className="flex h-11 items-center">
      <Link
        href="/"
        aria-label="홈으로 돌아가기"
        className="-ml-2.5 flex size-11 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Image src="/back-icon.svg" alt="" width={24} height={24} priority />
      </Link>
    </header>
  );
}
