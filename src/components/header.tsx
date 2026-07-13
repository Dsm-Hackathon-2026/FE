import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="flex items-center justify-between">
      <h1 aria-label="성덕순례">
        <Image
          src="/header-logo.svg"
          alt=""
          width={93}
          height={32}
          data-testid="header-logo"
          priority
        />
      </h1>

      <Link
        href="/search"
        aria-label="검색"
        className="-mr-2.5 flex size-11 items-center justify-center"
      >
        <Image
          src="/search-icon.svg"
          alt=""
          width={24}
          height={24}
          data-testid="search-icon"
        />
      </Link>
    </header>
  );
}
